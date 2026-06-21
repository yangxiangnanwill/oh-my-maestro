// Maestro IDE — Backend Entry Point

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFile } from 'node:fs/promises';
import { EventBus } from './event-bus.js';
import { WSGateway } from './ws-gateway.js';
import { TranslatorMiddleware } from './translator.js';
import { StateSyncEngine } from './state-sync.js';
import { CLIAdapterRegistry, DefaultCLIAdapter, UnsupportedVersionError } from './cli-adapter.js';
import { DelegateExecutor } from './delegate-executor.js';

export class MaestroIDEServer {
  readonly app: Hono;
  readonly eventBus: EventBus;
  readonly translator: TranslatorMiddleware;
  readonly wsGateway: WSGateway;
  readonly stateSync: StateSyncEngine;
  readonly cliAdapter: CLIAdapterRegistry;
  readonly delegateExecutor: DelegateExecutor;

  private httpServer: ReturnType<typeof serve> | null = null;
  private detectedVersion: string | null = null;

  constructor(private options: { httpPort: number; wsPort: number; watchPaths?: string[] }) {
    this.app = new Hono();
    this.eventBus = new EventBus();
    this.translator = new TranslatorMiddleware(this.eventBus);
    this.wsGateway = new WSGateway(this.eventBus, this.translator);
    this.stateSync = new StateSyncEngine(this.eventBus, options.watchPaths ?? []);

    this.cliAdapter = new CLIAdapterRegistry();
    this.cliAdapter.register('1', new DefaultCLIAdapter());
    this.delegateExecutor = new DelegateExecutor(this.eventBus);

    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (c) => {
      return c.json({
        status: 'ok',
        clients: this.wsGateway.getClientCount(),
        translations: this.translator.getStats(),
      });
    });

    // Get translations (for client-side cache)
    this.app.get('/api/translations', (c) => {
      return c.json(this.translator.getTranslations());
    });

    // Get display mode for a client
    this.app.get('/api/mode/:clientId', (c) => {
      const clientId = c.req.param('clientId');
      const mode = this.translator.getClientMode(clientId);
      return c.json({ clientId, mode });
    });

    // Set display mode for a client
    this.app.post('/api/mode/:clientId', async (c) => {
      const clientId = c.req.param('clientId');
      const { mode } = await c.req.json<{ mode: 'simple' | 'advanced' }>();
      this.translator.setClientMode(clientId, mode);
      return c.json({ clientId, mode });
    });

    // GET /api/workflows — list available workflows
    this.app.get('/api/workflows', async (c) => {
      try {
        const version = this.detectedVersion ?? '1';
        this.cliAdapter.getAdapter(version);
        // In real usage, this would call `maestro ralph skills --json` and parse with adapter
        // For now, return empty list since we need to run the actual CLI
        return c.json({ workflows: [], version: this.detectedVersion });
      } catch (err) {
        return c.json({ error: 'Failed to list workflows', details: String(err) }, 500);
      }
    });

    // POST /api/workflows/execute — trigger workflow execution
    this.app.post('/api/workflows/execute', async (c) => {
      try {
        const body = await c.req.json<{ workflowId: string; params: Record<string, unknown> }>();
        const executionId = this.delegateExecutor.execute(body.workflowId, body.params);
        return c.json({ executionId, status: 'queued' });
      } catch (err) {
        return c.json({ error: 'Failed to execute workflow', details: String(err) }, 500);
      }
    });

    // GET /api/project/state — read project state from .workflow/state.json
    this.app.get('/api/project/state', async (c) => {
      try {
        const projectDir = process.env.MAESTRO_PROJECT_DIR ?? process.cwd();
        const statePath = projectDir + '/.workflow/state.json';
        const content = await readFile(statePath, 'utf-8');
        return c.json(JSON.parse(content));
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          return c.json({ error: 'Project state not found' }, 404);
        }
        return c.json({ error: 'Failed to read project state', details: String(err) }, 500);
      }
    });
  }

  /**
   * Initialize server — detect CLI version.
   */
  async init(): Promise<void> {
    try {
      this.detectedVersion = await this.cliAdapter.detectVersion();
      console.log(`[Maestro IDE] Detected maestro version: ${this.detectedVersion}`);
    } catch (err) {
      if (err instanceof UnsupportedVersionError) {
        console.warn('[Maestro IDE] Unsupported CLI version, using default adapter:', err.version);
        this.detectedVersion = '1';
      } else {
        console.error('[Maestro IDE] Version detection failed:', err);
        this.detectedVersion = '1';
      }
    }
  }

  /**
   * Start the server.
   */
  async start(): Promise<void> {
    await this.init();

    // Start WebSocket gateway
    this.wsGateway.start(this.options.wsPort);

    // Start State Sync Engine
    this.stateSync.start();

    // Start HTTP server
    this.httpServer = serve({
      fetch: this.app.fetch,
      port: this.options.httpPort,
    });

    console.log(
      `[Maestro IDE] Server started — HTTP:${this.options.httpPort} WS:${this.options.wsPort}`
    );
  }

  /**
   * Stop the server.
   */
  stop(): void {
    this.stateSync.stop();
    this.wsGateway.stop();
    this.httpServer?.close();
    this.eventBus.clear();
    console.log('[Maestro IDE] Server stopped');
  }
}

// Auto-start when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MaestroIDEServer({
    httpPort: 3000,
    wsPort: 3001,
    watchPaths: process.env.MAESTRO_PROJECT_DIR
      ? [process.env.MAESTRO_PROJECT_DIR + '/.workflow']
      : [],
  });
  server.start().then(() => {
    process.on('SIGINT', () => {
      server.stop();
      process.exit(0);
    });
  }).catch(err => {
    console.error('[Maestro IDE] Failed to start:', err);
    process.exit(1);
  });
}
