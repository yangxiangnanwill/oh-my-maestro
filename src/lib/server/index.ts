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
import { GateManager } from './gate-manager.js';
import { TerminalManager } from './terminal-manager.js';
import { DialogManager, type SpawnFn } from './dialog-manager.js';
import { spawn } from 'node:child_process';

export class MaestroIDEServer {
  readonly app: Hono;
  readonly eventBus: EventBus;
  readonly translator: TranslatorMiddleware;
  readonly wsGateway: WSGateway;
  readonly stateSync: StateSyncEngine;
  readonly cliAdapter: CLIAdapterRegistry;
  readonly delegateExecutor: DelegateExecutor;
  readonly gateManager: GateManager;
  readonly terminalManager: TerminalManager;
  readonly dialogManager: DialogManager;

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
    this.gateManager = new GateManager(this.eventBus, this.delegateExecutor);
    this.terminalManager = new TerminalManager(this.eventBus);
    // Wrap spawn to match SpawnFn signature (args as second param)
    const spawnFn: SpawnFn = (command, args, options) => spawn(command, args ?? [], options ?? {});
    this.dialogManager = new DialogManager(this.eventBus, spawnFn, []);

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

    // POST /api/workflows/execute — trigger workflow execution (Phase 3: gate gating)
    this.app.post('/api/workflows/execute', async (c) => {
      try {
        const body = await c.req.json<{ workflowId: string; params: Record<string, unknown> }>();
        const executionId = `exec-${Date.now()}`;

        // 执行 dry-run 分析
        let dryRunResult = '';
        try {
          dryRunResult = await this.gateManager.performDryRun(
            body.workflowId,
            body.params,
          );
        } catch {
          // Dry-run 失败不阻断流程，直接标记为空
          dryRunResult = '';
        }

        // 创建审批门控（发布 gate:pending 事件，客户端展示 ApprovalPanel）
        const gate = this.gateManager.createGate(
          executionId,
          0, // stepIndex starts at 0 for single-step workflows
          dryRunResult,
        );

        return c.json({
          executionId: gate.executionId,
          gateId: gate.gateId,
          status: 'pending' as const,
        });
      } catch (err) {
        return c.json({ error: 'Failed to execute workflow', details: String(err) }, 500);
      }
    });

    // POST /api/gates/:id/resolve — resolve approval gate (Phase 3: gate resolution)
    this.app.post('/api/gates/:id/resolve', async (c) => {
      try {
        const gateId = c.req.param('id');
        const { approved } = await c.req.json<{ approved: boolean }>();

        const gate = this.gateManager.resolveGate(gateId, approved);

        if (!gate) {
          return c.json({ error: 'Gate not found' }, 404);
        }

        // 确认通过后执行实际的 delegate
        if (approved && gate.status === 'approved') {
          // 构建 params：从 gate 中提取工作流信息
          const params: Record<string, unknown> = {};
          this.delegateExecutor.execute(gate.executionId, params);
        }

        return c.json({
          gateId: gate.gateId,
          status: gate.status,
        });
      } catch (err) {
        return c.json({ error: 'Failed to resolve gate', details: String(err) }, 500);
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

    // ── Terminal API endpoints ──

    // POST /api/terminal/create — create a new terminal session
    this.app.post('/api/terminal/create', async (c) => {
      try {
        const body = await c.req.json<{ cwd?: string; cols?: number; rows?: number; shell?: string }>().catch(() => ({}));
        const terminalId = `term-${Date.now()}`;
        const session = this.terminalManager.createTerminal(terminalId, body);
        return c.json({ terminalId, session });
      } catch (err) {
        return c.json({ error: 'Failed to create terminal', details: String(err) }, 500);
      }
    });

    // POST /api/terminal/:id/write — write data to a terminal
    this.app.post('/api/terminal/:id/write', async (c) => {
      try {
        const terminalId = c.req.param('id');
        const { data } = await c.req.json<{ data: string }>();
        this.terminalManager.writeToTerminal(terminalId, data);
        return c.json({ ok: true });
      } catch (err) {
        return c.json({ error: 'Failed to write to terminal', details: String(err) }, 500);
      }
    });

    // POST /api/terminal/:id/resize — resize a terminal
    this.app.post('/api/terminal/:id/resize', async (c) => {
      try {
        const terminalId = c.req.param('id');
        const { cols, rows } = await c.req.json<{ cols: number; rows: number }>();
        this.terminalManager.resizeTerminal(terminalId, cols, rows);
        return c.json({ ok: true });
      } catch (err) {
        return c.json({ error: 'Failed to resize terminal', details: String(err) }, 500);
      }
    });

    // POST /api/terminal/:id/destroy — destroy a terminal session
    this.app.post('/api/terminal/:id/destroy', async (c) => {
      try {
        const terminalId = c.req.param('id');
        this.terminalManager.destroyTerminal(terminalId);
        return c.json({ ok: true });
      } catch (err) {
        return c.json({ error: 'Failed to destroy terminal', details: String(err) }, 500);
      }
    });

    // ── Dialog API endpoints ──

    // POST /api/dialog/sessions — create a new dialog session
    this.app.post('/api/dialog/sessions', async (c) => {
      try {
        const body = await c.req.json<{ clientId?: string }>().catch(() => ({ clientId: undefined }));
        const clientId = body.clientId ?? 'http-client';
        const session = this.dialogManager.createSession(clientId);
        return c.json({ session });
      } catch (err) {
        return c.json({ error: 'Failed to create dialog session', details: String(err) }, 500);
      }
    });

    // POST /api/dialog/sessions/:id/message — send a message to a dialog session
    this.app.post('/api/dialog/sessions/:id/message', async (c) => {
      try {
        const sessionId = c.req.param('id');
        const { message } = await c.req.json<{ message: string }>();
        this.dialogManager.sendMessage(sessionId, message);
        return c.json({ ok: true });
      } catch (err) {
        return c.json({ error: 'Failed to send message', details: String(err) }, 500);
      }
    });

    // POST /api/dialog/sessions/:id/close — close a dialog session
    this.app.post('/api/dialog/sessions/:id/close', async (c) => {
      try {
        const sessionId = c.req.param('id');
        this.dialogManager.closeSession(sessionId);
        return c.json({ ok: true });
      } catch (err) {
        return c.json({ error: 'Failed to close dialog session', details: String(err) }, 500);
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
    this.terminalManager.destroyAll();
    this.dialogManager.closeAll();
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

    // Windows ConPTY sends SIGBREAK instead of SIGINT for Ctrl+C
    process.on('SIGBREAK', () => {
      server.stop();
      process.exit(0);
    });

    // Fallback: ensure server cleanup on any exit
    process.on('exit', (code) => {
      server.stop();
    });
  }).catch(err => {
    console.error('[Maestro IDE] Failed to start:', err);
    process.exit(1);
  });
}
