import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TerminalManager } from '../terminal-manager.js';
import type { SpawnPtyFn, TerminalOutputEntry } from '../terminal-manager.js';
import { EventBus } from '../event-bus.js';
import { Channels, TerminalEvents } from '../../shared/events.js';
import type { TerminalSession } from '../../shared/types.js';

/** Mock IPty returned by mock spawn */
interface MockIPty {
  pid: number;
  cols: number;
  rows: number;
  process: string;
  handleFlowControl: boolean;
  onData: (listener: (data: string) => void) => { dispose: () => void };
  onExit: (listener: (e: { exitCode: number; signal?: number }) => void) => { dispose: () => void };
  resize: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
}

/** Create a mock IPty with controllable data/exit callbacks */
function createMockPty(overrides?: Partial<{ pid: number; cols: number; rows: number }>): {
  pty: MockIPty;
  dataListeners: Array<(data: string) => void>;
  exitListeners: Array<(e: { exitCode: number; signal?: number }) => void>;
} {
  const dataListeners: Array<(data: string) => void> = [];
  const exitListeners: Array<(e: { exitCode: number; signal?: number }) => void> = [];

  const pty: MockIPty = {
    pid: overrides?.pid ?? 12345,
    cols: overrides?.cols ?? 80,
    rows: overrides?.rows ?? 24,
    process: 'powershell.exe',
    handleFlowControl: false,
    onData: (listener: (data: string) => void) => {
      dataListeners.push(listener);
      return { dispose: () => {} };
    },
    onExit: (listener: (e: { exitCode: number; signal?: number }) => void) => {
      exitListeners.push(listener);
      return { dispose: () => {} };
    },
    resize: vi.fn(),
    write: vi.fn(),
    kill: vi.fn(),
    clear: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };

  return { pty, dataListeners, exitListeners };
}

/** Create a mock spawn function that captures calls and returns mock PTYs */
function createMockSpawn() {
  const ptyRecords: ReturnType<typeof createMockPty>[] = [];
  const calls: { file: string; args: string[]; options: Record<string, unknown> }[] = [];

  const spawnFn: SpawnPtyFn = (file, args, options) => {
    calls.push({ file, args, options });
    const record = createMockPty();
    ptyRecords.push(record);
    return record.pty as unknown as import('node-pty').IPty;
  };

  return { spawnFn, ptyRecords, calls };
}

describe('TerminalManager', () => {
  let eventBus: EventBus;
  let mock: ReturnType<typeof createMockSpawn>;
  let manager: TerminalManager;

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus = new EventBus();
    mock = createMockSpawn();
    manager = new TerminalManager(eventBus, mock.spawnFn);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createTerminal()', () => {
    it('should spawn PTY and return TerminalSession with correct fields', () => {
      const session = manager.createTerminal('term-1');

      expect(session).toBeDefined();
      expect(session.terminalId).toBe('term-1');
      expect(session.ptyPid).toBe(12345);
      expect(session.cwd).toBe(process.cwd());
      expect(session.cols).toBe(80);
      expect(session.rows).toBe(24);
      expect(session.status).toBe('running');

      // Verify spawn was called
      expect(mock.calls).toHaveLength(1);
      expect(mock.calls[0].options.name).toBe('xterm-256color');
    });

    it('should emit CREATED event on EventBus', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.CREATED, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');

      expect(received).toHaveLength(1);
      const event = received[0] as { terminalId: string; session: TerminalSession };
      expect(event.terminalId).toBe('term-1');
      expect(event.session.status).toBe('running');
    });

    it('should respect custom options (cwd, cols, rows, shell)', () => {
      manager.createTerminal('term-custom', {
        cwd: '/tmp',
        cols: 120,
        rows: 40,
        shell: '/bin/zsh',
      });

      expect(mock.calls).toHaveLength(1);
      expect(mock.calls[0].file).toBe('/bin/zsh');
      expect(mock.calls[0].options.cwd).toBe('/tmp');
      expect(mock.calls[0].options.cols).toBe(120);
      expect(mock.calls[0].options.rows).toBe(40);
    });

    it('should throw Error when max sessions (5) reached', () => {
      // Create 5 sessions
      for (let i = 0; i < 5; i++) {
        manager.createTerminal(`term-${i}`);
      }

      // 6th should throw
      expect(() => manager.createTerminal('term-5')).toThrow(
        'Maximum terminal sessions (5) reached',
      );
    });
  });

  describe('PTY data → OUTPUT throttle', () => {
    it('should accumulate data to buffer and flush after 33ms', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.OUTPUT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // Simulate PTY data
      record.dataListeners[0]('hello ');
      record.dataListeners[0]('world');

      // Before throttle — no output yet
      expect(received).toHaveLength(0);

      // Advance past 33ms throttle
      vi.advanceTimersByTime(33);

      // Now output should be flushed
      expect(received).toHaveLength(1);
      const event = received[0] as { terminalId: string; data: string };
      expect(event.terminalId).toBe('term-1');
      expect(event.data).toBe('hello world');
    });

    it('should emit OUTPUT per throttle interval (not per data event)', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.OUTPUT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // First batch
      record.dataListeners[0]('a');
      vi.advanceTimersByTime(33);
      expect(received).toHaveLength(1);

      // Second batch
      record.dataListeners[0]('b');
      vi.advanceTimersByTime(33);
      expect(received).toHaveLength(2);

      expect((received[0] as { data: string }).data).toBe('a');
      expect((received[1] as { data: string }).data).toBe('b');
    });

    it('should not emit OUTPUT if buffer is empty at throttle tick', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.OUTPUT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');

      // Advance timer without any data
      vi.advanceTimersByTime(33);

      expect(received).toHaveLength(0);
    });
  });

  describe('writeToTerminal()', () => {
    it('should call pty.write with data', () => {
      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      manager.writeToTerminal('term-1', 'ls -la\n');

      expect(record.pty.write).toHaveBeenCalledWith('ls -la\n');
    });

    it('should emit INPUT event on EventBus', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.INPUT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');

      // Clear the INPUT event from EventBus subscription (constructor subscribes too)
      // We need to track only the writeToTerminal emission
      const inputEvents: unknown[] = [];
      eventBus.subscribe(TerminalEvents.INPUT, (payload) => {
        inputEvents.push(payload);
      });

      manager.writeToTerminal('term-1', 'echo hello');

      // The constructor subscription + our subscription both fire
      // The constructor subscription calls writeToTerminal again (re-entrant), but
      // since it's the same data going to pty.write, it's idempotent
      // We just verify our subscription received the event
      expect(inputEvents.length).toBeGreaterThanOrEqual(1);
      const event = inputEvents[0] as { terminalId: string; data: string };
      expect(event.terminalId).toBe('term-1');
      expect(event.data).toBe('echo hello');
    });

    it('should silently no-op for non-existent terminalId', () => {
      expect(() => manager.writeToTerminal('nonexistent', 'data')).not.toThrow();
    });
  });

  describe('resizeTerminal()', () => {
    it('should call pty.resize and update session cols/rows', () => {
      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      manager.resizeTerminal('term-1', 120, 40);

      expect(record.pty.resize).toHaveBeenCalledWith(120, 40);

      const session = manager.getSession('term-1');
      expect(session!.cols).toBe(120);
      expect(session!.rows).toBe(40);
    });

    it('should emit RESIZE event on EventBus', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.RESIZE, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      manager.resizeTerminal('term-1', 120, 40);

      expect(received).toHaveLength(1);
      const event = received[0] as { terminalId: string; cols: number; rows: number };
      expect(event.terminalId).toBe('term-1');
      expect(event.cols).toBe(120);
      expect(event.rows).toBe(40);
    });

    it('should silently no-op for non-existent terminalId', () => {
      expect(() => manager.resizeTerminal('nonexistent', 80, 24)).not.toThrow();
    });
  });

  describe('destroyTerminal()', () => {
    it('should kill PTY, clear throttle, delete session, emit EXIT', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.EXIT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      manager.destroyTerminal('term-1');

      expect(record.pty.kill).toHaveBeenCalled();
      expect(manager.getSessionCount()).toBe(0);
      expect(manager.getSession('term-1')).toBeUndefined();

      expect(received).toHaveLength(1);
      const event = received[0] as { terminalId: string; exitCode: null };
      expect(event.terminalId).toBe('term-1');
      expect(event.exitCode).toBeNull();
    });

    it('should flush residual buffer on destroy', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.OUTPUT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // Send data, then destroy before throttle fires
      record.dataListeners[0]('some data');
      manager.destroyTerminal('term-1');

      // cleanupSession flushes residual buffer synchronously
      expect(received).toHaveLength(1);
      const output = received[0] as { terminalId: string; data: string };
      expect(output.terminalId).toBe('term-1');
      expect(output.data).toBe('some data');

      // Advance past throttle — no additional OUTPUT (timer was cleared)
      vi.advanceTimersByTime(33);
      expect(received).toHaveLength(1);
    });

    it('should silently no-op for non-existent terminalId', () => {
      expect(() => manager.destroyTerminal('nonexistent')).not.toThrow();
    });

    it('should silently no-op for already destroyed terminal', () => {
      manager.createTerminal('term-1');
      manager.destroyTerminal('term-1');

      // Second destroy should not throw
      expect(() => manager.destroyTerminal('term-1')).not.toThrow();
    });
  });

  describe('ring buffer', () => {
    it('should push entries and evict oldest when exceeding 1000', () => {
      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // Fill ring buffer beyond capacity
      for (let i = 0; i < 1100; i++) {
        record.dataListeners[0](`data-${i}`);
        vi.advanceTimersByTime(33);
      }

      const buffer = manager.getRingBuffer();
      expect(buffer.length).toBeLessThanOrEqual(1000);

      // First entry should be evicted — oldest remaining should be data-100
      expect(buffer[0].data).toBe('data-100');
      // Last entry should be data-1099
      expect(buffer[buffer.length - 1].data).toBe('data-1099');
    });

    it('should store TerminalOutputEntry with correct shape', () => {
      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      record.dataListeners[0]('hello');
      vi.advanceTimersByTime(33);

      const buffer = manager.getRingBuffer();
      expect(buffer).toHaveLength(1);
      expect(buffer[0]).toHaveProperty('terminalId', 'term-1');
      expect(buffer[0]).toHaveProperty('data', 'hello');
      expect(buffer[0]).toHaveProperty('timestamp');
      expect(typeof buffer[0].timestamp).toBe('string');
    });
  });

  describe('EventBus constructor subscription', () => {
    it('should subscribe to term:input events and route to writeToTerminal', () => {
      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // Publish term:input to EventBus (simulating client input)
      eventBus.publish(
        TerminalEvents.INPUT,
        Channels.TERMINAL,
        { terminalId: 'term-1', data: 'client-input\n' },
        'client',
      );

      // writeToTerminal should have been called via the constructor subscription
      expect(record.pty.write).toHaveBeenCalledWith('client-input\n');
    });
  });

  describe('PTY onExit handling', () => {
    it('should clean up session and emit EXIT on PTY exit', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.EXIT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // Simulate PTY process exit
      record.exitListeners[0]({ exitCode: 0 });

      expect(manager.getSessionCount()).toBe(0);
      expect(received).toHaveLength(1);
      const event = received[0] as { terminalId: string; exitCode: number };
      expect(event.terminalId).toBe('term-1');
      expect(event.exitCode).toBe(0);
    });

    it('should flush residual buffer on PTY exit', () => {
      const received: unknown[] = [];
      eventBus.subscribe(TerminalEvents.OUTPUT, (payload) => {
        received.push(payload);
      });

      manager.createTerminal('term-1');
      const record = mock.ptyRecords[0];

      // Send data, then PTY exits before throttle fires
      record.dataListeners[0]('some data');
      record.exitListeners[0]({ exitCode: 1 });

      // cleanupSession flushes residual buffer synchronously
      expect(received).toHaveLength(1);
      const output = received[0] as { terminalId: string; data: string };
      expect(output.terminalId).toBe('term-1');
      expect(output.data).toBe('some data');

      // Advance past throttle — no additional OUTPUT (timer was cleared)
      vi.advanceTimersByTime(33);
      expect(received).toHaveLength(1);
    });
  });

  describe('destroyAll()', () => {
    it('should destroy all active sessions', () => {
      manager.createTerminal('term-1');
      manager.createTerminal('term-2');
      manager.createTerminal('term-3');

      expect(manager.getSessionCount()).toBe(3);

      manager.destroyAll();

      expect(manager.getSessionCount()).toBe(0);
      expect(mock.ptyRecords[0].pty.kill).toHaveBeenCalled();
      expect(mock.ptyRecords[1].pty.kill).toHaveBeenCalled();
      expect(mock.ptyRecords[2].pty.kill).toHaveBeenCalled();
    });
  });

  describe('getSession()', () => {
    it('should return session for existing terminal', () => {
      const created = manager.createTerminal('term-1');
      const found = manager.getSession('term-1');

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent terminal', () => {
      expect(manager.getSession('nonexistent')).toBeUndefined();
    });
  });
});
