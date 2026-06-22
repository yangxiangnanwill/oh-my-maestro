import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../event-bus.js';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should publish and subscribe to events', () => {
    const received: unknown[] = [];
    bus.subscribe('test-event', (payload) => {
      received.push(payload);
    });

    bus.publish('test-event', 'test-channel', { value: 42 });
    bus.publish('test-event', 'test-channel', { value: 43 });

    expect(received).toHaveLength(2);
    expect(received[0]).toEqual({ value: 42 });
    expect(received[1]).toEqual({ value: 43 });
  });

  it('should support unsubscribing', () => {
    const received: unknown[] = [];
    const unsub = bus.subscribe('test-event', (payload) => {
      received.push(payload);
    });

    bus.publish('test-event', 'test-channel', { value: 1 });
    unsub();
    bus.publish('test-event', 'test-channel', { value: 2 });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ value: 1 });
  });

  it('should support wildcard subscribers', () => {
    const received: string[] = [];
    bus.onAny((_payload, event) => {
      received.push(event.type);
    });

    bus.publish('event-a', 'ch', {});
    bus.publish('event-b', 'ch', {});

    expect(received).toEqual(['event-a', 'event-b']);
  });

  it('should store event history', () => {
    bus.publish('evt-1', 'ch', { a: 1 });
    bus.publish('evt-2', 'ch', { b: 2 });
    bus.publish('evt-1', 'ch', { c: 3 });

    const all = bus.getHistory();
    expect(all).toHaveLength(3);

    const filtered = bus.getHistory('evt-1');
    expect(filtered).toHaveLength(2);
  });

  it('should isolate errors in subscribers', () => {
    bus.subscribe('test', () => {
      throw new Error('subscriber error');
    });

    const received: unknown[] = [];
    bus.subscribe('test', (payload) => {
      received.push(payload);
    });

    // Should not throw, second subscriber still receives event
    bus.publish('test', 'ch', { ok: true });
    expect(received).toEqual([{ ok: true }]);
  });

  it('should count subscribers', () => {
    bus.subscribe('a', () => {});
    bus.subscribe('a', () => {});
    bus.subscribe('b', () => {});
    bus.onAny(() => {});

    expect(bus.getSubscriberCount('a')).toBe(3); // 2 specific + 1 wildcard
    expect(bus.getSubscriberCount('b')).toBe(2); // 1 specific + 1 wildcard
    expect(bus.getSubscriberCount()).toBe(4); // 3 specific + 1 wildcard
  });

  it('should skip history when skipHistory=true (high-frequency events)', () => {
    // Publish without skipHistory — should enter history
    bus.publish('normal-event', 'ch', { value: 1 });
    expect(bus.getHistory()).toHaveLength(1);

    // Publish with skipHistory=true — should NOT enter history
    bus.publish('high-freq-event', 'ch', { value: 2 }, 'server', { skipHistory: true });
    bus.publish('high-freq-event', 'ch', { value: 3 }, 'server', { skipHistory: true });

    // Only the normal event should be in history
    const history = bus.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('normal-event');
  });

  it('should still deliver events to subscribers when skipHistory=true', () => {
    const received: unknown[] = [];
    bus.subscribe('high-freq-event', (payload) => {
      received.push(payload);
    });

    bus.publish('high-freq-event', 'ch', { value: 42 }, 'server', { skipHistory: true });

    // Subscriber receives the event
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ value: 42 });

    // But event is not in history
    const history = bus.getHistory();
    expect(history).toHaveLength(0);
  });

  it('should handle maxHistory=100 (was 1000)', () => {
    // Publish 150 events — only the last 100 should remain
    for (let i = 0; i < 150; i++) {
      bus.publish('test-event', 'ch', { index: i });
    }

    const history = bus.getHistory(undefined, 200);
    expect(history.length).toBe(100);
    expect(history[0].payload).toEqual({ index: 50 });
    expect(history[history.length - 1].payload).toEqual({ index: 149 });
  });

  it('should verify publish-to-broadcast latency < 500ms (p95)', async () => {
    const events: { publishTime: number; broadcastTime: number }[] = [];

    bus.onAny((_payload, event) => {
      const broadcastTime = Date.now();
      const publishTime = new Date(event.timestamp).getTime();
      events.push({ publishTime, broadcastTime });
    });

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      bus.publish('latency-test', 'ch', { index: i });
    }

    // All events should be broadcast synchronously (within same ms as publish)
    const latencies = events.map((e) => e.broadcastTime - e.publishTime);
    // Filter to p95: sort, take index at 95th percentile
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const end = Date.now();

    // All 100 publications should complete within 500ms total
    expect(end - start).toBeLessThan(500);
    // p95 latency should be under 500ms
    expect(p95).toBeLessThan(500);
  });
});
