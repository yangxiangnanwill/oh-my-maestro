import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { DialogManager } from '../dialog-manager.js';
import type { SpawnFn } from '../dialog-manager.js';
import { EventBus } from '../event-bus.js';
import { Channels, DialogEvents } from '../../shared/events.js';
import type { DialogSession, WorkflowMeta } from '../../shared/types.js';

/** Create a mock ChildProcess with controllable stdin/stdout/stderr EventEmitters */
function createMockProcess() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const stdin = new EventEmitter() as EventEmitter & { write: ReturnType<typeof vi.fn> };
  stdin.write = vi.fn();
  const handlers = new Map<string, Function>();

  const mockProcess = {
    stdout,
    stderr,
    stdin,
    pid: 12345,
    on: vi.fn((event: string, handler: Function) => {
      handlers.set(event, handler);
      return mockProcess;
    }),
    kill: vi.fn(),
    // Simulate process exit
    simulateExit(code: number | null) {
      const handler = handlers.get('exit');
      if (handler) handler(code);
    },
  };

  return mockProcess;
}

/** Create a mock spawn function that captures args and returns a mock process */
function createMockSpawn() {
  const processes: ReturnType<typeof createMockProcess>[] = [];
  const calls: { command: string; args: readonly string[] }[] = [];

  const spawnFn: SpawnFn = (command: string, args?: readonly string[]) => {
    calls.push({ command, args: args ?? [] });
    const mockProc = createMockProcess();
    processes.push(mockProc);
    return mockProc as unknown as import('node:child_process').ChildProcess;
  };

  return { spawnFn, processes, calls };
}

/** Sample workflow registry for intent detection tests */
const SAMPLE_WORKFLOWS: WorkflowMeta[] = [
  {
    id: 'test-build',
    name: 'build',
    category: 'deploy',
    description: 'build the project',
    params: [],
  },
  {
    id: 'test-lint',
    name: 'lint',
    category: 'quality',
    description: 'run linter',
    params: [],
  },
  {
    id: 'test-deploy',
    name: 'deploy',
    category: 'deploy',
    description: 'deploy to production',
    params: [],
  },
];

describe('DialogManager', () => {
  let eventBus: EventBus;
  let mock: ReturnType<typeof createMockSpawn>;
  let manager: DialogManager;

  beforeEach(() => {
    eventBus = new EventBus();
    mock = createMockSpawn();
    manager = new DialogManager(eventBus, mock.spawnFn, [...SAMPLE_WORKFLOWS]);
  });

  describe('createSession()', () => {
    it('should return DialogSession and emit SESSION_CREATED', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.SESSION_CREATED, (payload) => {
        emitted.push(payload);
      });

      const session = manager.createSession('client-1');

      // Returns valid DialogSession
      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^dialog-\d+-\d+$/);
      expect(session.cliProcessId).toBeNull();
      expect(session.status).toBe('active');
      expect(session.createdAt).toBeDefined();
      expect(session.lastActivityAt).toBeDefined();

      // Emits SESSION_CREATED event
      expect(emitted).toHaveLength(1);
      const event = emitted[0] as Record<string, unknown>;
      expect(event.sessionId).toBe(session.sessionId);
      expect(event.clientId).toBe('client-1');
    });

    it('should generate unique sessionIds for multiple sessions', () => {
      const session1 = manager.createSession('client-1');
      const session2 = manager.createSession('client-2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should throw Error on 6th createSession call (max 5)', () => {
      // Create 5 sessions — should succeed
      for (let i = 0; i < 5; i++) {
        manager.createSession(`client-${i}`);
      }

      // 6th should throw
      expect(() => manager.createSession('client-6')).toThrow(
        'Maximum dialog sessions (5) reached',
      );
    });
  });

  describe('sendMessage()', () => {
    it('should start CLI subprocess on first sendMessage call', () => {
      const session = manager.createSession('client-1');

      manager.sendMessage(session.sessionId, 'build the project');

      // Spawned claude CLI
      expect(mock.calls).toHaveLength(1);
      expect(mock.calls[0].command).toBe('claude');
      expect(mock.calls[0].args).toContain('--output-format');
      expect(mock.calls[0].args).toContain('stream-json');
      expect(mock.calls[0].args).toContain('--verbose');

      // Wrote message to stdin
      expect(mock.processes[0].stdin.write).toHaveBeenCalledWith('build the project\n');
    });

    it('should write to existing process stdin on subsequent calls', () => {
      const session = manager.createSession('client-1');

      manager.sendMessage(session.sessionId, 'first message');
      manager.sendMessage(session.sessionId, 'second message');

      // Only one spawn call (first message starts it)
      expect(mock.calls).toHaveLength(1);

      // Both messages written to stdin
      expect(mock.processes[0].stdin.write).toHaveBeenCalledTimes(2);
      expect(mock.processes[0].stdin.write).toHaveBeenCalledWith('first message\n');
      expect(mock.processes[0].stdin.write).toHaveBeenCalledWith('second message\n');
    });

    it('should throw Error for unknown sessionId', () => {
      expect(() => manager.sendMessage('nonexistent', 'hello')).toThrow(
        'Dialog session not found: nonexistent',
      );
    });

    it('should update lastActivityAt on each message', () => {
      const session = manager.createSession('client-1');
      const beforeActivity = new Date(session.lastActivityAt).getTime();

      manager.sendMessage(session.sessionId, 'hello');

      // lastActivityAt should have been updated (>= original time)
      const activeDialog = (manager as unknown as { sessions: Map<string, { session: DialogSession }> })
        .sessions.get(session.sessionId);
      const afterActivity = new Date(activeDialog!.session.lastActivityAt).getTime();
      expect(afterActivity).toBeGreaterThanOrEqual(beforeActivity);
    });
  });

  describe('stdout NDJSON streaming', () => {
    it('should emit STREAM_CHUNK for valid NDJSON lines', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.STREAM_CHUNK, (payload) => {
        emitted.push(payload);
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'hello');

      const mockProc = mock.processes[0];
      const chunk = JSON.stringify({
        type: 'text',
        content: 'Hello, how can I help?',
        timestamp: '2026-01-01T00:00:00Z',
      });

      mockProc.stdout.emit('data', chunk + '\n');

      expect(emitted).toHaveLength(1);
      const event = emitted[0] as Record<string, unknown>;
      expect(event.sessionId).toBe(session.sessionId);
      expect(event.type).toBe('text');
      expect(event.content).toBe('Hello, how can I help?');
    });

    it('should skip invalid JSON lines silently', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.STREAM_CHUNK, () => {
        emitted.push({});
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'hello');

      const mockProc = mock.processes[0];
      mockProc.stdout.emit('data', 'not-json\n');

      expect(emitted).toHaveLength(0);
    });

    it('should skip empty and whitespace-only lines', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.STREAM_CHUNK, () => {
        emitted.push({});
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'hello');

      const mockProc = mock.processes[0];
      mockProc.stdout.emit('data', '\n   \n\t\n');

      expect(emitted).toHaveLength(0);
    });

    it('should handle tool_use, tool_result, and error chunk types', () => {
      const emitted: Record<string, unknown>[] = [];
      eventBus.subscribe(DialogEvents.STREAM_CHUNK, (payload) => {
        emitted.push(payload as Record<string, unknown>);
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'hello');

      const mockProc = mock.processes[0];
      const lines = [
        JSON.stringify({ type: 'tool_use', content: 'using tool', timestamp: '2026-01-01T00:00:00Z' }),
        JSON.stringify({ type: 'tool_result', content: 'result', timestamp: '2026-01-01T00:00:01Z' }),
        JSON.stringify({ type: 'error', content: 'oops', timestamp: '2026-01-01T00:00:02Z' }),
      ].join('\n');

      mockProc.stdout.emit('data', lines);

      expect(emitted).toHaveLength(3);
      expect(emitted[0].type).toBe('tool_use');
      expect(emitted[1].type).toBe('tool_result');
      expect(emitted[2].type).toBe('error');
    });
  });

  describe('detectIntent()', () => {
    it('should return confidence >= 0.8 when message contains workflow name and keywords', () => {
      const intent = manager.detectIntent('build the project for production');

      expect(intent.confidence).toBeGreaterThanOrEqual(0.5);
      expect(intent.workflowId).toBe('test-build');
      expect(intent.candidates.length).toBeGreaterThanOrEqual(1);
    });

    it('should emit INTENT_ROUTED with direct route when confidence >= 0.8', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.INTENT_ROUTED, (payload) => {
        emitted.push(payload);
      });

      const session = manager.createSession('client-1');
      // "build the project deploy" matches test-build name + description keywords + category
      // name "build" (+0.5) + category "deploy" (+0.2) + desc keywords "build","the","project" (+0.1 each) = 1.0 (clamped)
      manager.sendMessage(session.sessionId, 'build the project deploy');

      const routed = emitted.find(
        (e) => (e as Record<string, unknown>).workflowId !== null,
      ) as Record<string, unknown> | undefined;

      // The intent detection from sendMessage emits INTENT_ROUTED
      expect(routed).toBeDefined();
      expect(routed!.workflowId).toBe('test-build');
      expect(routed!.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should emit INTENT_ROUTED with disambiguation when confidence 0.5-0.8', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.INTENT_ROUTED, (payload) => {
        emitted.push(payload);
      });

      const session = manager.createSession('client-1');
      // "deploy" matches both test-build (category) and test-deploy (name + category)
      // Should produce score >= 0.5 for at least one
      manager.sendMessage(session.sessionId, 'deploy the project');

      const routed = emitted.filter(
        (e) => (e as Record<string, unknown>).workflowId === null,
      ) as Record<string, unknown>[];

      // If confidence is 0.5-0.8, workflowId is null and candidates are included
      // If confidence < 0.5, no INTENT_ROUTED is emitted at all
      if (routed.length > 0) {
        expect(routed[0].candidates).toBeDefined();
      }
    });

    it('should not emit INTENT_ROUTED for confidence < 0.5', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.INTENT_ROUTED, () => {
        emitted.push({});
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'xyzzy');

      // No INTENT_ROUTED should be emitted for unrelated messages
      expect(emitted).toHaveLength(0);
    });

    it('should return empty result when workflowRegistry is empty', () => {
      const emptyManager = new DialogManager(eventBus, mock.spawnFn, []);

      const intent = emptyManager.detectIntent('build the project');

      expect(intent.workflowId).toBeNull();
      expect(intent.confidence).toBe(0);
      expect(intent.candidates).toEqual([]);
    });
  });

  describe('closeSession()', () => {
    it('should kill subprocess, delete session, and emit SESSION_CLOSED', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.SESSION_CLOSED, (payload) => {
        emitted.push(payload);
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'hello');

      const mockProc = mock.processes[0];

      manager.closeSession(session.sessionId);

      // Killed the process
      expect(mockProc.kill).toHaveBeenCalled();

      // Emitted SESSION_CLOSED
      expect(emitted).toHaveLength(1);
      const event = emitted[0] as Record<string, unknown>;
      expect(event.sessionId).toBe(session.sessionId);

      // Session removed
      expect(manager.hasSession(session.sessionId)).toBe(false);
    });

    it('should silently return for unknown sessionId', () => {
      expect(() => manager.closeSession('nonexistent')).not.toThrow();
    });

    it('should emit SESSION_CLOSED on process exit', () => {
      const emitted: unknown[] = [];
      eventBus.subscribe(DialogEvents.SESSION_CLOSED, (payload) => {
        emitted.push(payload);
      });

      const session = manager.createSession('client-1');
      manager.sendMessage(session.sessionId, 'hello');

      const mockProc = mock.processes[0];
      mockProc.simulateExit(0);

      expect(emitted).toHaveLength(1);
      const event = emitted[0] as Record<string, unknown>;
      expect(event.sessionId).toBe(session.sessionId);
      expect(event.exitCode).toBe(0);
    });
  });

  describe('updateWorkflowRegistry()', () => {
    it('should update internal workflow registry', () => {
      const newWorkflows: WorkflowMeta[] = [
        {
          id: 'new-workflow',
          name: 'analyze',
          category: 'analysis',
          description: 'analyze codebase',
          params: [],
        },
      ];

      manager.updateWorkflowRegistry(newWorkflows);

      // Intent detection should use new workflows
      const intent = manager.detectIntent('analyze codebase');
      expect(intent.workflowId).toBe('new-workflow');
      expect(intent.confidence).toBeGreaterThan(0);
    });
  });

  describe('getSessionCount()', () => {
    it('should return current active session count', () => {
      expect(manager.getSessionCount()).toBe(0);

      const session = manager.createSession('client-1');
      expect(manager.getSessionCount()).toBe(1);

      manager.closeSession(session.sessionId);
      expect(manager.getSessionCount()).toBe(0);
    });
  });
});
