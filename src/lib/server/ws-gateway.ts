// Maestro IDE — WebSocket Gateway

import { WebSocketServer, WebSocket } from 'ws';
import type { EventBus, InternalEvent } from './event-bus.js';
import type { WSMessage, DisplayMode } from '../shared/types.js';
import { Channels, StateSyncEvents } from '../shared/events.js';
import type { TranslatorMiddleware } from './translator.js';

interface ClientConnection {
  ws: WebSocket;
  id: string;
  subscribedChannels: Set<string>;
  connectedAt: string;
  lastActivityAt: string;
}

/**
 * WebSocket Gateway — manages client connections, subscriptions,
 * and message routing between server EventBus and browser clients.
 */
export class WSGateway {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ClientConnection>();
  private clientCounter = 0;

  constructor(
    private eventBus: EventBus,
    private translator: TranslatorMiddleware
  ) {}

  /**
   * Start the WebSocket server on the given port.
   */
  start(port: number): void {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      const clientId = `client-${++this.clientCounter}`;
      const client: ClientConnection = {
        ws,
        id: clientId,
        subscribedChannels: new Set(),
        connectedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      this.clients.set(clientId, client);

      // Default display mode is simple
      this.translator.setClientMode(clientId, 'simple');

      // Send connection confirmation
      this.sendToClient(client, {
        channel: Channels.STATE,
        type: StateSyncEvents.RECONNECT,
        payload: { clientId, mode: 'simple' },
        timestamp: new Date().toISOString(),
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          this.handleClientMessage(clientId, message);
        } catch (err) {
          console.error(`[WSGateway] Invalid message from ${clientId}:`, err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.translator.removeClient(clientId);
      });

      ws.on('error', (err) => {
        console.error(`[WSGateway] Error for ${clientId}:`, err);
        this.clients.delete(clientId);
        this.translator.removeClient(clientId);
      });
    });

    // Subscribe to all EventBus events and forward to clients
    this.eventBus.onAny((payload, event) => {
      this.broadcastEvent(event as InternalEvent);
    });
  }

  /**
   * Handle incoming message from a client.
   */
  private handleClientMessage(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivityAt = new Date().toISOString();

    switch (message.type) {
      case 'subscribe': {
        const channels = (message.payload as { channels: string[] }).channels;
        for (const ch of channels) {
          client.subscribedChannels.add(ch);
        }
        break;
      }
      case 'unsubscribe': {
        const channels = (message.payload as { channels: string[] }).channels;
        for (const ch of channels) {
          client.subscribedChannels.delete(ch);
        }
        break;
      }
      case 'set-mode': {
        const mode = (message.payload as { mode: DisplayMode }).mode;
        this.translator.setClientMode(clientId, mode);
        break;
      }
      default:
        // Forward other messages to EventBus
        this.eventBus.publish(message.type, message.channel, message.payload, 'client');
    }
  }

  /**
   * Broadcast an EventBus event to all subscribed clients.
   * High-frequency events (term:output, dialog:stream-chunk) skip translation
   * to avoid redundant JSON.stringify and object traversal overhead.
   * Pre-serializes the message once for non-translated broadcasts — each client
   * reuses the same serialized string instead of re-serializing per client.
   */
  private broadcastEvent(event: InternalEvent): void {
    // High-frequency events: skip translator middleware to avoid double JSON.stringify
    const isHighFreq = event.type === 'term:output' || event.type === 'dialog:stream-chunk';

    // Pre-serialize the base message for non-translated broadcasts
    const baseMessage: WSMessage = {
      channel: event.channel,
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
    };
    const preSerialized = JSON.stringify(baseMessage);

    for (const client of this.clients.values()) {
      if (client.subscribedChannels.has(event.channel) || client.subscribedChannels.has('*')) {
        if (!isHighFreq && typeof event.payload === 'object' && event.payload !== null) {
          // Translation needed — serialize per-client with translated payload
          const { translated } = this.translator.translate(
            event.payload as Record<string, unknown>,
            client.id
          );
          const translatedMessage: WSMessage = {
            channel: event.channel,
            type: event.type,
            payload: translated,
            timestamp: event.timestamp,
          };
          this.sendToClient(client, translatedMessage);
        } else {
          // No translation needed — reuse pre-serialized string
          this.sendRawToClient(client, preSerialized);
        }
      }
    }
  }

  /**
   * Send a message to a specific client.
   * Checks bufferedAmount to skip slow clients (prevents server memory backpressure).
   */
  private sendToClient(client: ClientConnection, message: WSMessage): void {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    // Backpressure check — skip slow clients with > 64KB buffered data
    if (client.ws.bufferedAmount > 65536) {
      console.warn(
        `[WSGateway] Skipping slow client ${client.id}: bufferedAmount=${client.ws.bufferedAmount} bytes (threshold=65536)`,
      );
      return;
    }

    client.ws.send(JSON.stringify(message));
  }

  /**
   * Send a pre-serialized message string to a specific client.
   * Used for non-translated broadcasts where the message was pre-serialized once.
   */
  private sendRawToClient(client: ClientConnection, preSerialized: string): void {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    // Backpressure check — skip slow clients with > 64KB buffered data
    if (client.ws.bufferedAmount > 65536) {
      console.warn(
        `[WSGateway] Skipping slow client ${client.id}: bufferedAmount=${client.ws.bufferedAmount} bytes (threshold=65536)`,
      );
      return;
    }

    client.ws.send(preSerialized);
  }

  /**
   * Get connected client count.
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Stop the WebSocket server.
   */
  stop(): void {
    if (this.wss) {
      for (const client of this.clients.values()) {
        client.ws.close();
      }
      this.wss.close();
      this.clients.clear();
    }
  }
}
