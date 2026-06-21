// Maestro IDE — Terminal Manager (PTY Session Management + Frame Throttle + Ring Buffer)

import { type IPty, spawn as ptySpawn } from 'node-pty';
import type { EventBus } from './event-bus.js';
import type { TerminalSession, TerminalStatus } from '../shared/types.js';
import { Channels, TerminalEvents } from '../shared/events.js';

/** Single entry in the ring buffer */
export interface TerminalOutputEntry {
  terminalId: string;
  data: string;
  timestamp: string;
}

/** Internal tracking for an active terminal session */
interface ActiveTerminal {
  pty: IPty;
  session: TerminalSession;
  buffer: string[];
  throttleTimer: ReturnType<typeof setInterval> | null;
}

/** Spawn function signature — matches node-pty spawn */
export type SpawnPtyFn = (
  file: string,
  args: string[],
  options: { name: string; cols: number; rows: number; cwd: string },
) => IPty;

/** Options for createTerminal */
export interface CreateTerminalOptions {
  cwd?: string;
  cols?: number;
  rows?: number;
  shell?: string;
}

/**
 * TerminalManager — manages PTY sessions via node-pty.
 *
 * Handles session lifecycle (create/write/resize/destroy), 33ms frame throttle
 * for output, ring buffer (capacity 1000), and max 5 concurrent sessions.
 * Communicates all terminal events through EventBus.
 */
export class TerminalManager {
  private sessions = new Map<string, ActiveTerminal>();
  private ringBuffer: TerminalOutputEntry[] = [];
  private readonly MAX_SESSIONS = 5;
  private readonly THROTTLE_MS = 33;
  private readonly RING_BUFFER_CAPACITY = 1000;

  constructor(
    private eventBus: EventBus,
    private spawnPty: SpawnPtyFn = ptySpawn as SpawnPtyFn,
  ) {
    // Subscribe to term:input events from EventBus (client → PTY)
    // Direct PTY write to avoid re-entrant loop (writeToTerminal also emits INPUT)
    this.eventBus.subscribe(TerminalEvents.INPUT, (payload) => {
      const { terminalId, data } = payload as { terminalId: string; data: string };
      const active = this.sessions.get(terminalId);
      if (active) {
        active.pty.write(data);
      }
    });

    // Subscribe to term:create events from EventBus (client request → spawn PTY)
    this.eventBus.subscribe(TerminalEvents.CREATE, (payload) => {
      const { options } = (payload ?? {}) as { options?: Record<string, unknown> };
      const terminalId = `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.createTerminal(terminalId, options as CreateTerminalOptions);
    });

    // Subscribe to term:destroy events from EventBus (client request → kill PTY)
    this.eventBus.subscribe(TerminalEvents.DESTROY, (payload) => {
      const { terminalId } = payload as { terminalId: string };
      this.destroyTerminal(terminalId);
    });
  }

  /**
   * Create a new terminal session.
   * Spawns a PTY process and starts the frame throttle for output.
   * Throws if max sessions (5) reached.
   */
  createTerminal(terminalId: string, options?: CreateTerminalOptions): TerminalSession {
    if (this.sessions.size >= this.MAX_SESSIONS) {
      throw new Error(`Maximum terminal sessions (${this.MAX_SESSIONS}) reached`);
    }

    const cwd = options?.cwd ?? process.cwd();
    const cols = options?.cols ?? 80;
    const rows = options?.rows ?? 24;
    const shell =
      options?.shell ??
      (process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL ?? '/bin/bash'));

    const pty = this.spawnPty(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
    });

    const session: TerminalSession = {
      terminalId,
      ptyPid: pty.pid,
      cwd,
      cols,
      rows,
      status: 'running',
    };

    const active: ActiveTerminal = {
      pty,
      session,
      buffer: [],
      throttleTimer: null,
    };

    this.sessions.set(terminalId, active);

    // Start frame throttle for output
    this.startFrameThrottle(terminalId, pty);

    // Handle PTY exit
    pty.onExit(({ exitCode }) => {
      this.handlePtyExit(terminalId, exitCode);
    });

    // Emit CREATED event
    this.eventBus.publish(
      TerminalEvents.CREATED,
      Channels.TERMINAL,
      { terminalId, session },
      'server',
    );

    return session;
  }

  /**
   * Write data to a terminal's PTY.
   * Silently no-ops if the terminal doesn't exist.
   */
  writeToTerminal(terminalId: string, data: string): void {
    const active = this.sessions.get(terminalId);
    if (!active) return;

    active.pty.write(data);

    this.eventBus.publish(
      TerminalEvents.INPUT,
      Channels.TERMINAL,
      { terminalId, data, timestamp: new Date().toISOString() },
      'server',
    );
  }

  /**
   * Resize a terminal's PTY dimensions.
   * Silently no-ops if the terminal doesn't exist.
   */
  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    const active = this.sessions.get(terminalId);
    if (!active) return;

    active.pty.resize(cols, rows);
    active.session.cols = cols;
    active.session.rows = rows;

    this.eventBus.publish(
      TerminalEvents.RESIZE,
      Channels.TERMINAL,
      { terminalId, cols, rows, timestamp: new Date().toISOString() },
      'server',
    );
  }

  /**
   * Destroy a terminal session — kills PTY, clears throttle, removes from tracking.
   * Silently no-ops if the terminal doesn't exist.
   */
  destroyTerminal(terminalId: string): void {
    const active = this.sessions.get(terminalId);
    if (!active) return;

    // Clear throttle timer
    if (active.throttleTimer !== null) {
      clearInterval(active.throttleTimer);
      active.throttleTimer = null;
    }

    // Kill PTY process
    active.pty.kill();

    // Remove from sessions
    this.sessions.delete(terminalId);

    // Emit EXIT event
    this.eventBus.publish(
      TerminalEvents.EXIT,
      Channels.TERMINAL,
      { terminalId, exitCode: null, timestamp: new Date().toISOString() },
      'server',
    );
  }

  /**
   * Get a snapshot of the ring buffer.
   */
  getRingBuffer(): TerminalOutputEntry[] {
    return [...this.ringBuffer];
  }

  /**
   * Get the number of active sessions.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get a specific terminal session.
   */
  getSession(terminalId: string): TerminalSession | undefined {
    return this.sessions.get(terminalId)?.session;
  }

  /**
   * Destroy all sessions (cleanup).
   */
  destroyAll(): void {
    for (const terminalId of [...this.sessions.keys()]) {
      this.destroyTerminal(terminalId);
    }
  }

  /**
   * Start the 33ms frame throttle for PTY output.
   * Accumulates data in buffer, flushes every THROTTLE_MS.
   */
  private startFrameThrottle(terminalId: string, pty: IPty): void {
    const active = this.sessions.get(terminalId);
    if (!active) return;

    // Register PTY data listener — accumulates to buffer
    pty.onData((data: string) => {
      active.buffer.push(data);
    });

    // Set up throttle timer
    active.throttleTimer = setInterval(() => {
      if (active.buffer.length > 0) {
        const combined = active.buffer.join('');
        active.buffer = [];

        // Emit OUTPUT event
        this.eventBus.publish(
          TerminalEvents.OUTPUT,
          Channels.TERMINAL,
          { terminalId, data: combined, timestamp: new Date().toISOString() },
          'server',
        );

        // Append to ring buffer, evict oldest if at capacity
        this.ringBuffer.push({
          terminalId,
          data: combined,
          timestamp: new Date().toISOString(),
        });
        if (this.ringBuffer.length > this.RING_BUFFER_CAPACITY) {
          this.ringBuffer.shift();
        }
      }
    }, this.THROTTLE_MS);
  }

  /**
   * Handle PTY process exit (triggered by onExit callback).
   */
  private handlePtyExit(terminalId: string, exitCode: number): void {
    const active = this.sessions.get(terminalId);
    if (!active) return;

    // Clear throttle timer
    if (active.throttleTimer !== null) {
      clearInterval(active.throttleTimer);
      active.throttleTimer = null;
    }

    // Remove from sessions
    this.sessions.delete(terminalId);

    // Emit EXIT event
    this.eventBus.publish(
      TerminalEvents.EXIT,
      Channels.TERMINAL,
      { terminalId, exitCode, timestamp: new Date().toISOString() },
      'server',
    );
  }
}
