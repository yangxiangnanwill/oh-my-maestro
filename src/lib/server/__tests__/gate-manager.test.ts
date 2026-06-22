import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventBus } from '../event-bus.js';
import { GateManager } from '../gate-manager.js';
import { DelegateExecutor } from '../delegate-executor.js';
import { Channels, GateEvents } from '../../shared/events.js';
import type { ApprovalGate } from '../../shared/types.js';

describe('GateManager', () => {
  let eventBus: EventBus;
  let delegateExecutor: DelegateExecutor;
  let gateManager: GateManager;

  beforeEach(() => {
    eventBus = new EventBus();
    delegateExecutor = new DelegateExecutor(eventBus);
    gateManager = new GateManager(eventBus, delegateExecutor);
    vi.useFakeTimers();
  });

  afterEach(() => {
    gateManager.clearAll();
    vi.useRealTimers();
  });

  describe('createGate()', () => {
    it('should create a gate and publish gate:pending event', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.PENDING, (payload) => {
        events.push(payload);
      });

      const gate = gateManager.createGate('exec-1', 0, 'dry-run output');

      expect(gate.gateId).toMatch(/^gate-\d+-\d+$/);
      expect(gate.executionId).toBe('exec-1');
      expect(gate.stepIndex).toBe(0);
      expect(gate.dryRunResult).toBe('dry-run output');
      expect(gate.status).toBe('presented');

      // gate:pending 事件已发布
      expect(events).toHaveLength(1);
      const published = events[0] as ApprovalGate;
      expect(published.gateId).toBe(gate.gateId);
    });

    it('should publish to Channels.GATE', () => {
      const received: { channel: string; source: string }[] = [];
      eventBus.onAny((_payload, event) => {
        received.push({ channel: event.channel, source: event.source });
      });

      gateManager.createGate('exec-1', 0, '');

      const gateEvents = received.filter((r) => r.channel === Channels.GATE);
      expect(gateEvents.length).toBeGreaterThanOrEqual(1);
      expect(gateEvents[0].source).toBe('server');
    });

    it('should generate unique gate IDs with incrementing counter', () => {
      const gate1 = gateManager.createGate('exec-1', 0, '');
      const gate2 = gateManager.createGate('exec-2', 1, '');

      expect(gate1.gateId).not.toBe(gate2.gateId);
      expect(gate1.gateId).toMatch(/^gate-1-/);
      expect(gate2.gateId).toMatch(/^gate-2-/);
    });
  });

  describe('resolveGate()', () => {
    it('should resolve gate as approved and publish gate:resolved', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, (payload) => {
        events.push(payload);
      });

      const gate = gateManager.createGate('exec-1', 0, '');
      const resolved = gateManager.resolveGate(gate.gateId, true);

      expect(resolved).toBeDefined();
      expect(resolved!.status).toBe('approved');
      expect(resolved!.resolvedAt).not.toBeNull();

      // gate:resolved 事件已发布
      expect(events).toHaveLength(1);
      const published = events[0] as ApprovalGate;
      expect(published.status).toBe('approved');
    });

    it('should resolve gate as rejected and publish gate:resolved', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, (payload) => {
        events.push(payload);
      });

      const gate = gateManager.createGate('exec-1', 0, '');
      const resolved = gateManager.resolveGate(gate.gateId, false);

      expect(resolved).toBeDefined();
      expect(resolved!.status).toBe('rejected');

      expect(events).toHaveLength(1);
      const published = events[0] as ApprovalGate;
      expect(published.status).toBe('rejected');
    });

    it('should return undefined for unknown gateId', () => {
      const result = gateManager.resolveGate('nonexistent', true);
      expect(result).toBeUndefined();
    });

    it('should not resolve a gate that is already resolved', () => {
      const gate = gateManager.createGate('exec-1', 0, '');
      gateManager.resolveGate(gate.gateId, true);

      // 尝试再次解析
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, () => {
        events.push({});
      });

      const result = gateManager.resolveGate(gate.gateId, false);
      expect(result!.status).toBe('approved'); // 状态不变
      expect(events).toHaveLength(0); // 没有新事件
    });
  });

  describe('30s timeout', () => {
    it('should auto-reject after 30 seconds with expired status', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, (payload) => {
        events.push(payload);
      });

      const gate = gateManager.createGate('exec-1', 0, '');

      // 快进 30 秒
      vi.advanceTimersByTime(30_000);

      expect(events).toHaveLength(1);
      const published = events[0] as ApprovalGate;
      expect(published.status).toBe('expired');
      expect(published.gateId).toBe(gate.gateId);
    });

    it('should not auto-reject if gate was already resolved', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, (payload) => {
        events.push(payload);
      });

      const gate = gateManager.createGate('exec-1', 0, '');
      gateManager.resolveGate(gate.gateId, true);

      // 快进 30 秒 — 不应触发额外事件
      vi.advanceTimersByTime(30_000);

      expect(events).toHaveLength(1); // 只有手动 resolve 的事件
    });

    it('should clear timer on manual resolve', () => {
      const gate = gateManager.createGate('exec-1', 0, '');
      gateManager.resolveGate(gate.gateId, true);

      // 快进 30 秒 — 不应有副作用
      vi.advanceTimersByTime(30_000);

      const stored = gateManager.getGate(gate.gateId);
      expect(stored!.status).toBe('approved');
    });
  });

  describe('getGate()', () => {
    it('should return gate by ID', () => {
      const gate = gateManager.createGate('exec-1', 0, 'test');
      const found = gateManager.getGate(gate.gateId);
      expect(found).toBeDefined();
      expect(found!.gateId).toBe(gate.gateId);
    });

    it('should return undefined for unknown ID', () => {
      expect(gateManager.getGate('nonexistent')).toBeUndefined();
    });
  });

  describe('clearGate()', () => {
    it('should remove gate from memory and clear timer', () => {
      const gate = gateManager.createGate('exec-1', 0, '');
      gateManager.clearGate(gate.gateId);

      expect(gateManager.getGate(gate.gateId)).toBeUndefined();

      // 快进 30 秒 — 不应触发超时事件
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, () => events.push({}));
      vi.advanceTimersByTime(30_000);
      expect(events).toHaveLength(0);
    });
  });

  describe('clearAll()', () => {
    it('should remove all gates and clear all timers', () => {
      const gate1 = gateManager.createGate('exec-1', 0, '');
      const gate2 = gateManager.createGate('exec-2', 1, '');

      gateManager.clearAll();

      expect(gateManager.getGate(gate1.gateId)).toBeUndefined();
      expect(gateManager.getGate(gate2.gateId)).toBeUndefined();
    });
  });

  describe('buildDryRunPrompt()', () => {
    it('should build prompt from workflowId and params', () => {
      const prompt = gateManager.buildDryRunPrompt('my-workflow', {
        param1: 'value1',
        param2: 42,
      });

      expect(prompt).toContain('my-workflow');
      expect(prompt).toContain('param1');
      expect(prompt).toContain('value1');
      expect(prompt).toContain('param2');
      expect(prompt).toContain('42');
    });

    it('should exclude tool param from prompt', () => {
      const prompt = gateManager.buildDryRunPrompt('my-workflow', {
        tool: 'codex',
        param1: 'value1',
      });

      expect(prompt).toContain('param1');
      expect(prompt).not.toContain('tool');
    });

    it('should return just workflowId when no params', () => {
      const prompt = gateManager.buildDryRunPrompt('my-workflow', {});
      expect(prompt).toBe('my-workflow');
    });
  });

  describe('performDryRun()', () => {
    it('should call delegateExecutor.executeDryRun with correct args', async () => {
      const dryRunSpy = vi
        .spyOn(delegateExecutor, 'executeDryRun')
        .mockResolvedValue('mock dry-run output');

      const result = await gateManager.performDryRun('my-workflow', {
        tool: 'claude',
        param1: 'value1',
      });

      expect(dryRunSpy).toHaveBeenCalledWith(
        expect.stringContaining('my-workflow'),
        'claude',
      );
      expect(result).toBe('mock dry-run output');

      dryRunSpy.mockRestore();
    });

    it('should default tool to claude', async () => {
      const dryRunSpy = vi
        .spyOn(delegateExecutor, 'executeDryRun')
        .mockResolvedValue('output');

      await gateManager.performDryRun('my-workflow', {});

      expect(dryRunSpy).toHaveBeenCalledWith(
        expect.any(String),
        'claude',
      );

      dryRunSpy.mockRestore();
    });
  });

  describe('status transitions', () => {
    it('should follow pending -> presented -> approved flow', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.PENDING, (p) => events.push({ type: 'pending', payload: p }));
      eventBus.subscribe(GateEvents.RESOLVED, (p) => events.push({ type: 'resolved', payload: p }));

      const gate = gateManager.createGate('exec-1', 0, '');
      expect(gate.status).toBe('presented');

      const resolved = gateManager.resolveGate(gate.gateId, true);
      expect(resolved!.status).toBe('approved');

      expect(events).toHaveLength(2);
    });

    it('should follow pending -> presented -> rejected flow', () => {
      const gate = gateManager.createGate('exec-1', 0, '');
      const resolved = gateManager.resolveGate(gate.gateId, false);
      expect(resolved!.status).toBe('rejected');
    });

    it('should follow pending -> presented -> expired flow on timeout', () => {
      const events: unknown[] = [];
      eventBus.subscribe(GateEvents.RESOLVED, (p) => events.push(p));

      const gate = gateManager.createGate('exec-1', 0, '');
      vi.advanceTimersByTime(30_000);

      const stored = gateManager.getGate(gate.gateId);
      expect(stored!.status).toBe('expired');
    });
  });
});
