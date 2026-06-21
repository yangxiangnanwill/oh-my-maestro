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
   */
  private broadcastEvent(event: InternalEvent): void {
    for (const client of this.clients.values()) {
      const message: WSMessage = {
        channel: event.channel,
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp,
      };

      if (client.subscribedChannels.has(event.channel) || client.subscribedChannels.has('*')) {
        // Apply translation for this client
        if (typeof event.payload === 'object' && event.payload !== null) {
          const { translated } = this.translator.translate(
            event.payload as Record<string, unknown>,
            client.id
          );
          message.payload = translated;
        }
        this.sendToClient(client, message);
      }
    }
  }

  /**
   * Send a message to a specific client.
   */
  private sendToClient(client: ClientConnection, message: WSMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
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
