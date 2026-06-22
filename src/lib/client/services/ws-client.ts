// Maestro IDE — WebSocket Client for Frontend

import type { WSMessage, DisplayMode } from '../../shared/types.js';
import { Channels, StateSyncEvents } from '../../shared/events.js';

type MessageHandler = (message: WSMessage) => void;

/** State snapshot for event-driven connection tracking */
export interface WSClientState {
  connected: boolean;
  mode: DisplayMode;
  clientId: string | null;
}

type StateChangeCallback = (state: WSClientState) => void;

/**
 * WebSocket client for Svelte frontend.
 * Handles connection, reconnection, and message routing.
 */
export class WSClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private clientId: string | null = null;
  private connected = $state(false);
  private mode: DisplayMode = $state('simple');
  private stateCallbacks = new Set<StateChangeCallback>();

  constructor(private url: string) {}

  /**
   * Connect to the WebSocket server.
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectDelay = 1000;
      this.notifyStateChange();
      // Subscribe to all channels
      this.send({
        channel: '*',
        type: 'subscribe',
        payload: { channels: [Channels.WORKFLOW, Channels.PROJECT, Channels.DIALOG, Channels.TERMINAL, Channels.GATE, Channels.STATE] },
        timestamp: new Date().toISOString(),
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        this.handleMessage(message);
      } catch (err) {
        console.error('[WSClient] Invalid message:', err);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.notifyStateChange();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.connected = false;
      this.notifyStateChange();
    };
  }

  /**
   * Handle an incoming message.
   */
  private handleMessage(message: WSMessage): void {
    // Handle connection confirmation
    if (message.type === StateSyncEvents.RECONNECT) {
      const payload = message.payload as { clientId?: string; mode?: DisplayMode };
      this.clientId = payload.clientId ?? null;
      if (payload.mode) this.mode = payload.mode;
      this.notifyStateChange();
    }

    // Route to handlers
    const channelHandlers = this.handlers.get(message.channel);
    if (channelHandlers) {
      for (const handler of channelHandlers) {
        handler(message);
      }
    }

    // Also route to wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        handler(message);
      }
    }
  }

  /**
   * Subscribe to a channel.
   */
  on(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    return () => {
      this.handlers.get(channel)?.delete(handler);
    };
  }

  /**
   * Send a message to the server.
   */
  send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Set display mode (simple/advanced).
   */
  setMode(mode: DisplayMode): void {
    this.mode = mode;
    this.notifyStateChange();
    this.send({
      channel: Channels.STATE,
      type: 'set-mode',
      payload: { mode },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register a callback for connection state changes (connected, mode, clientId).
   * Returns an unsubscribe function. Replaces polling-based state sync.
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  /**
   * Notify all registered state change callbacks with current state.
   */
  private notifyStateChange(): void {
    const state: WSClientState = {
      connected: this.connected,
      mode: this.mode,
      clientId: this.clientId,
    };
    for (const cb of this.stateCallbacks) {
      cb(state);
    }
  }

  /**
   * Schedule reconnection with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from the server.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  /**
   * Reactive getters for Svelte $state
   */
  get isConnected(): boolean { return this.connected; }
  get currentMode(): DisplayMode { return this.mode; }
  get currentClientId(): string | null { return this.clientId; }
}
