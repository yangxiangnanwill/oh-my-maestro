import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WSGateway } from '../ws-gateway.js';
import { EventBus } from '../event-bus.js';
import { TranslatorMiddleware } from '../translator.js';
import { Channels, StateSyncEvents } from '../../shared/events.js';
import type { WSMessage } from '../../shared/types.js';

// Shared mutable state for mock — accessible from hoisted vi.mock factory
const mockState: {
  wss: {
    on: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  } | null;
  connectionHandler: ((ws: unknown) => void) | null;
} = {
  wss: null,
  connectionHandler: null,
};

// Mock the 'ws' module — factory must be self-contained (hoisted to top)
vi.mock('ws', () => {
  return {
    WebSocketServer: vi.fn(() => {
      const wss = {
        on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
          if (event === 'connection') {
            mockState.connectionHandler = handler as (ws: unknown) => void;
          }
        }),
        close: vi.fn(),
      };
      mockState.wss = wss;
      return wss;
    }),
    WebSocket: { OPEN: 1, CLOSED: 3 },
  };
});

/**
 * Create a mock WebSocket client with configurable readyState.
 */
function createMockWS(overrides?: Partial<{ readyState: number }>) {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const ws = {
    readyState: overrides?.readyState ?? 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeListener: vi.fn(),
    // Helper to simulate incoming events
    _emit(event: string, ...args: unknown[]) {
      const handlers = listeners[event] ?? [];
      for (const h of handlers) h(...args);
    },
  };
  return ws;
}

describe('WSGateway', () => {
  let eventBus: EventBus;
  let translator: TranslatorMiddleware;
  let gateway: WSGateway;

  beforeEach(() => {
    vi.restoreAllMocks();
    eventBus = new EventBus();
    translator = new TranslatorMiddleware(eventBus);
    gateway = new WSGateway(eventBus, translator);

    // Reset mock state
    mockState.wss = null;
    mockState.connectionHandler = null;
  });

  /**
   * Helper: start the gateway and simulate a client connection.
   */
  function startAndConnect() {
    gateway.start(3001);

    const ws = createMockWS();
    mockState.connectionHandler!(ws);

    return { ws, gateway };
  }

  it('start() creates WebSocketServer on given port', async () => {
    const { WebSocketServer } = await import('ws');
    gateway.start(3001);
    expect(WebSocketServer).toHaveBeenCalledWith({ port: 3001 });
  });

  it('client connects: receives RECONNECT message with clientId and mode=simple', () => {
    const { ws } = startAndConnect();

    expect(ws.send).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(ws.send.mock.calls[0][0] as string) as WSMessage;
    expect(sent.channel).toBe(Channels.STATE);
    expect(sent.type).toBe(StateSyncEvents.RECONNECT);
    expect(sent.payload).toEqual({ clientId: 'client-1', mode: 'simple' });
  });

  it('client disconnects: removed from clients map and translator.removeClient called', () => {
    const { ws } = startAndConnect();

    expect(gateway.getClientCount()).toBe(1);

    const removeSpy = vi.spyOn(translator, 'removeClient');
    ws._emit('close');

    expect(gateway.getClientCount()).toBe(0);
    expect(removeSpy).toHaveBeenCalledWith('client-1');
  });

  it('client subscribes to channels: subscribedChannels updated', () => {
    const { ws } = startAndConnect();

    // Clear the initial RECONNECT send
    ws.send.mockClear();

    // Simulate subscribe message
    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow', 'project'] },
    })));

    // Verify by publishing an event on workflow channel
    const receivedMessages: WSMessage[] = [];
    ws.send.mockImplementation((data: string) => {
      receivedMessages.push(JSON.parse(data));
    });

    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'test' });
    expect(receivedMessages.length).toBeGreaterThanOrEqual(1);
    expect(receivedMessages[receivedMessages.length - 1].channel).toBe(Channels.WORKFLOW);
  });

  it('client unsubscribes from channels: subscribedChannels updated', () => {
    const { ws } = startAndConnect();
    ws.send.mockClear();

    // Subscribe first
    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));

    // Then unsubscribe
    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'unsubscribe',
      payload: { channels: ['workflow'] },
    })));

    // Publish event — client should NOT receive it
    const receivedMessages: WSMessage[] = [];
    ws.send.mockImplementation((data: string) => {
      receivedMessages.push(JSON.parse(data));
    });

    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'test' });
    expect(receivedMessages).toHaveLength(0);
  });

  it('client sends set-mode: translator.setClientMode called', () => {
    const { ws } = startAndConnect();
    ws.send.mockClear();

    const setModeSpy = vi.spyOn(translator, 'setClientMode');

    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'set-mode',
      payload: { mode: 'advanced' },
    })));

    expect(setModeSpy).toHaveBeenCalledWith('client-1', 'advanced');
  });

  it('broadcast to subscribed clients only: subscribed client receives, unsubscribed does not', () => {
    gateway.start(3001);

    const ws1 = createMockWS();
    const ws2 = createMockWS();
    mockState.connectionHandler!(ws1); // client-1
    mockState.connectionHandler!(ws2); // client-2

    ws1.send.mockClear();
    ws2.send.mockClear();

    // client-1 subscribes to 'workflow', client-2 does not
    ws1._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));

    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'build' });

    // client-1 should receive, client-2 should not
    expect(ws1.send).toHaveBeenCalled();
    expect(ws2.send).not.toHaveBeenCalled();
  });

  it('wildcard subscription: client subscribed to "*" receives all messages', () => {
    gateway.start(3001);

    const ws = createMockWS();
    mockState.connectionHandler!(ws);
    ws.send.mockClear();

    // Subscribe to wildcard
    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['*'] },
    })));

    // Publish to different channels
    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'build' });
    eventBus.publish('project:state-update', Channels.PROJECT, { projectId: 'p1' });

    // Should receive both messages (plus no RECONNECT in this clear)
    const sentCalls = ws.send.mock.calls;
    expect(sentCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('translation applied per client mode: simple vs advanced', () => {
    gateway.start(3001);

    // Create two clients: one simple, one advanced
    const simpleWS = createMockWS();
    const advancedWS = createMockWS();
    mockState.connectionHandler!(simpleWS); // client-1
    mockState.connectionHandler!(advancedWS); // client-2

    // Set client-2 to advanced
    advancedWS._emit('message', Buffer.from(JSON.stringify({
      type: 'set-mode',
      payload: { mode: 'advanced' },
    })));

    // Both subscribe to 'workflow'
    simpleWS._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));
    advancedWS._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));

    simpleWS.send.mockClear();
    advancedWS.send.mockClear();

    // Publish event with a translatable field
    eventBus.publish('workflow:step-update', Channels.WORKFLOW, {
      stepName: 'execute',
    });

    const simpleMsg = JSON.parse(simpleWS.send.mock.calls[0][0] as string) as WSMessage;
    const advancedMsg = JSON.parse(advancedWS.send.mock.calls[0][0] as string) as WSMessage;

    // Simple mode should translate "execute" in stepName -> "Build"
    expect((simpleMsg.payload as Record<string, unknown>).stepName).toBe('Build');
    // Advanced mode should have "Execute (Build)"
    expect((advancedMsg.payload as Record<string, unknown>).stepName).toBe('Execute (Build)');
  });

  it('client reconnects after server restart and receives RECONNECT confirmation', () => {
    // Start gateway and have StateSyncEngine create some events in the event bus
    const { ws: ws1 } = startAndConnect();
    ws1.send.mockClear();

    // Simulate a client subscribing and some events going through the bus
    ws1._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['state'] },
    })));

    // Publish some events that the state sync engine would produce
    eventBus.publish('state:sync', Channels.STATE, { event: { id: 'sync-1', source: 'in-process' } }, 'server');
    eventBus.publish('state:sync', Channels.STATE, { event: { id: 'sync-2', source: 'in-process' } }, 'server');

    // Simulate server stop and restart
    gateway.stop();

    // New gateway instance (simulating server restart)
    const newGateway = new WSGateway(eventBus, translator);
    newGateway.start(3001);

    // A new client connects — should get RECONNECT message
    const newWS = createMockWS();
    mockState.connectionHandler!(newWS);

    expect(newWS.send).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(newWS.send.mock.calls[0][0] as string) as WSMessage;
    expect(sent.type).toBe(StateSyncEvents.RECONNECT);
    expect(sent.payload).toHaveProperty('clientId');
    expect(sent.payload).toHaveProperty('mode');

    newGateway.stop();
  });

  it('broadcast latency from EventBus.publish to client.send < 500ms', () => {
    vi.useFakeTimers();

    gateway.start(3001);

    const ws = createMockWS();
    mockState.connectionHandler!(ws);

    // Subscribe to workflow channel
    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));

    ws.send.mockClear();

    // Publish event
    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'test' });

    // Advance timers by up to 500ms — message should arrive synchronously
    vi.advanceTimersByTime(500);

    expect(ws.send).toHaveBeenCalled();

    // The EventBus publishes synchronously, so the message should arrive immediately
    // without any timer advancement — but we verify it arrives within 500ms
    const sent = JSON.parse(ws.send.mock.calls[0][0] as string) as WSMessage;
    expect(sent.channel).toBe(Channels.WORKFLOW);

    vi.useRealTimers();
    gateway.stop();
  });

  it('client error removes client from map and calls translator.removeClient', () => {
    const { ws } = startAndConnect();

    expect(gateway.getClientCount()).toBe(1);

    const removeSpy = vi.spyOn(translator, 'removeClient');
    ws._emit('error', new Error('test error'));

    expect(gateway.getClientCount()).toBe(0);
    expect(removeSpy).toHaveBeenCalledWith('client-1');
  });

  it('stop() closes all client connections and clears the server', () => {
    const { ws } = startAndConnect();

    gateway.stop();

    expect(ws.close).toHaveBeenCalled();
    expect(gateway.getClientCount()).toBe(0);
  });

  it('ignores invalid JSON messages without crashing', () => {
    const { ws } = startAndConnect();
    ws.send.mockClear();

    // Send invalid JSON
    expect(() => ws._emit('message', Buffer.from('not-json'))).not.toThrow();
  });

  it('backpressure: skips client when bufferedAmount > 64KB', () => {
    gateway.start(3001);

    // Create a mock client with high bufferedAmount
    const slowWS = createMockWS({ readyState: 1 }); // OPEN
    // Override bufferedAmount to simulate slow client
    Object.defineProperty(slowWS, 'bufferedAmount', {
      value: 131072, // 128KB — exceeds 64KB threshold
      writable: true,
      configurable: true,
    });

    mockState.connectionHandler!(slowWS);
    slowWS.send.mockClear();

    // Subscribe to workflow channel
    slowWS._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));

    // Publish event — slow client should be skipped
    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'test' });

    // Slow client should NOT receive the message (bufferedAmount > 64KB)
    expect(slowWS.send).not.toHaveBeenCalled();

    gateway.stop();
  });

  it('backpressure: normal client still receives when bufferedAmount <= 64KB', () => {
    gateway.start(3001);

    // Create a mock client with low bufferedAmount
    const normalWS = createMockWS({ readyState: 1 }); // OPEN
    Object.defineProperty(normalWS, 'bufferedAmount', {
      value: 0, // well below threshold
      writable: true,
      configurable: true,
    });

    mockState.connectionHandler!(normalWS);
    normalWS.send.mockClear();

    // Subscribe to workflow channel
    normalWS._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['workflow'] },
    })));

    // Publish event — normal client should receive it
    eventBus.publish('workflow:step-update', Channels.WORKFLOW, { stepName: 'test' });

    expect(normalWS.send).toHaveBeenCalled();

    gateway.stop();
  });

  it('high-frequency events skip translator middleware (term:output, dialog:stream-chunk)', () => {
    gateway.start(3001);

    const ws = createMockWS();
    mockState.connectionHandler!(ws);
    ws.send.mockClear();

    // Subscribe to terminal channel
    ws._emit('message', Buffer.from(JSON.stringify({
      type: 'subscribe',
      payload: { channels: ['terminal'] },
    })));

    const translateSpy = vi.spyOn(translator, 'translate');

    // Publish term:output — should skip translator
    eventBus.publish('term:output', Channels.TERMINAL, { terminalId: 't1', data: 'hello' });

    // Translator.translate should NOT be called for term:output
    expect(translateSpy).not.toHaveBeenCalled();

    // Client should still receive the raw payload
    expect(ws.send).toHaveBeenCalled();
    const sent = JSON.parse(ws.send.mock.calls[0][0] as string) as WSMessage;
    expect(sent.payload).toEqual({ terminalId: 't1', data: 'hello' });

    translateSpy.mockRestore();
    gateway.stop();
  });
});
