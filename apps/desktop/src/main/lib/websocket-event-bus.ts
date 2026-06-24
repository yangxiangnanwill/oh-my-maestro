/**
 * WebSocketEventBus — lightweight in-process WebSocket server for event-driven
 * state synchronization between Maestro-flow backend and Superset frontend.
 *
 * Architecture (following ADR-004):
 *   Backend Service -> EventBus.publish(channel, event)
 *                          |
 *                          v
 *                     Client callbacks (in-process pub/sub)
 *                          |
 *                          v
 *                     WebSocket Server -> JSON over WS -> Browser
 *
 * Design decisions:
 * - Uses Node.js built-in `http` + manual WebSocket upgrade (RFC 6455).
 *   No external dependency required — avoids the `ws` library dependency that
 *   is not present in the current monorepo build.
 * - Minimal implementation: handshake, frame parsing/generation, ping/pong.
 *   Covers the subset of WebSocket protocol needed for localhost communication.
 * - Typed event payloads via generic parameter.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer, type Server as HttpServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import type { Socket } from "node:net";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Callback invoked when an event is published to a channel. */
type ChannelCallback = (event: unknown) => void;

/** Message frame sent over WebSocket. */
interface WsMessage {
  type: "subscribe" | "unsubscribe" | "event" | "pong" | "ping";
  channel?: string;
  payload?: unknown;
}

/** Connection state for a single WebSocket client. */
interface WsConnection {
  socket: Socket;
  /** Channels this client is subscribed to */
  subscriptions: Set<string>;
  /** Whether the initial handshake is complete */
  handshakeComplete: boolean;
  /** Timestamp of last pong received (for dead connection detection) */
  lastPong: number;
  /** Incremented per pong check — if stale >= 2 the connection is dead */
  missedPongs: number;
}

interface EventBusOptions {
  /** Port to listen on. Default: 51742 */
  port?: number;
  /** Host to bind to. Default: "127.0.0.1" */
  host?: string;
  /** Ping interval in ms. Default: 30000 */
  pingInterval?: number;
  /** Max consecutive missed pongs before disconnecting. Default: 2 */
  maxMissedPongs?: number;
}

// ---------------------------------------------------------------------------
// WebSocket frame helpers (RFC 6455)
// ---------------------------------------------------------------------------

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const OPCODE_TEXT = 0x1;
const OPCODE_CLOSE = 0x8;
const OPCODE_PING = 0x9;
const OPCODE_PONG = 0xa;

function computeAcceptKey(key: string): string {
  return createHash("sha1").update(key + WS_GUID).digest("base64");
}

function encodeFrame(payload: string): Buffer {
  const data = Buffer.from(payload, "utf-8");
  const length = data.length;

  let header: Buffer;
  let offset = 0;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text opcode
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, data]);
}

function encodeCloseFrame(code = 1000): Buffer {
  const buf = Buffer.alloc(4);
  buf[0] = 0x88; // FIN + close opcode
  buf[1] = 2;
  buf.writeUInt16BE(code, 2);
  return buf;
}

function encodePingFrame(): Buffer {
  const buf = Buffer.alloc(2);
  buf[0] = 0x89; // FIN + ping opcode
  buf[1] = 0;
  return buf;
}

function encodePongFrame(data?: Buffer): Buffer {
  const payload = data ?? Buffer.alloc(0);
  const buf = Buffer.alloc(2 + payload.length);
  buf[0] = 0x8a; // FIN + pong opcode
  buf[1] = payload.length;
  if (payload.length > 0) {
    payload.copy(buf, 2);
  }
  return buf;
}

/**
 * Parse WebSocket frames from accumulated buffer.
 * Returns parsed payloads and the remaining unconsumed buffer.
 */
function parseFrames(
  buffer: Buffer,
): { messages: string[]; remaining: Buffer } {
  const messages: string[] = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const byte0 = buffer[offset];
    const byte1 = buffer[offset + 1];
    const opcode = byte0 & 0x0f;
    const masked = (byte1 & 0x80) !== 0;
    let payloadLength = byte1 & 0x7f;

    offset += 2;

    if (payloadLength === 126) {
      if (offset + 2 > buffer.length) break;
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (offset + 8 > buffer.length) break;
      payloadLength = Number(buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    let maskKey: Buffer | null = null;
    if (masked) {
      if (offset + 4 > buffer.length) break;
      maskKey = buffer.subarray(offset, offset + 4);
      offset += 4;
    }

    if (offset + payloadLength > buffer.length) {
      // Incomplete frame — rewind and wait for more data
      offset = buffer.length - (buffer.length - offset + 2);
      break;
    }

    const payload = buffer.subarray(offset, offset + payloadLength);
    offset += payloadLength;

    // Handle control frames
    if (opcode === OPCODE_CLOSE) {
      // Close frame — return what we have
      continue;
    }

    if (opcode === OPCODE_PING) {
      // Ping — caller handles separately
      continue;
    }

    if (opcode === OPCODE_PONG) {
      // Pong — caller handles separately
      continue;
    }

    // Unmask payload if needed
    let data: Buffer;
    if (masked && maskKey) {
      data = Buffer.alloc(payloadLength);
      for (let i = 0; i < payloadLength; i++) {
        data[i] = payload[i] ^ maskKey[i % 4];
      }
    } else {
      data = payload;
    }

    messages.push(data.toString("utf-8"));
  }

  return { messages, remaining: buffer.subarray(offset) };
}

// ---------------------------------------------------------------------------
// WebSocketEventBus
// ---------------------------------------------------------------------------

export class WebSocketEventBus {
  private readonly port: number;
  private readonly host: string;
  private readonly pingInterval: number;
  private readonly maxMissedPongs: number;

  private server: HttpServer | null = null;
  private connections: Map<Socket, WsConnection> = new Map();
  private channels: Map<string, Set<ChannelCallback>> = new Map();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private started = false;

  constructor(options: EventBusOptions = {}) {
    this.port = options.port ?? 51742;
    this.host = options.host ?? "127.0.0.1";
    this.pingInterval = options.pingInterval ?? 30000;
    this.maxMissedPongs = options.maxMissedPongs ?? 2;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Start the WebSocket server. Idempotent — safe to call multiple times.
   */
  start(): Promise<void> {
    if (this.started) {
      console.log("[ws-event-bus] Already started, skipping");
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.server = createServer();

      this.server.on("upgrade", (req: IncomingMessage, socket: Socket, _head: Buffer) => {
        this.handleUpgrade(req, socket);
      });

      this.server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.warn(
            `[ws-event-bus] Port ${this.port} in use — another instance may be running`,
          );
          this.started = false;
          resolve();
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, this.host, () => {
        this.started = true;
        this.startPingLoop();
        console.log(
          `[ws-event-bus] WebSocket server listening on ws://${this.host}:${this.port}`,
        );
        resolve();
      });
    });
  }

  /**
   * Subscribe a callback to a channel.
   *
   * @param channel - Channel name (e.g., "ralph:decisions", "workflow:status")
   * @param callback - Called with the event payload whenever publish() is invoked on this channel
   */
  subscribe(channel: string, callback: ChannelCallback): void {
    let callbacks = this.channels.get(channel);
    if (!callbacks) {
      callbacks = new Set();
      this.channels.set(channel, callbacks);
    }
    callbacks.add(callback);
  }

  /**
   * Unsubscribe a callback from a channel.
   *
   * @param channel - Channel name
   * @param callback - The exact callback reference previously passed to subscribe()
   */
  unsubscribe(channel: string, callback: ChannelCallback): void {
    const callbacks = this.channels.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Publish an event to a channel.
   *
   * All local subscribers (via subscribe()) and remote WebSocket clients
   * subscribed to this channel will receive the event.
   *
   * @param channel - Channel name
   * @param event - Event payload (will be JSON-serialized)
   */
  publish(channel: string, event: unknown): void {
    // 1. Notify local (in-process) subscribers
    const callbacks = this.channels.get(channel);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(event);
        } catch (err) {
          console.error(`[ws-event-bus] Channel "${channel}" callback error:`, err);
        }
      }
    }

    // 2. Broadcast to remote WebSocket clients subscribed to this channel
    const frame = encodeFrame(
      JSON.stringify({
        type: "event",
        channel,
        payload: event,
      }),
    );

    for (const [socket, conn] of this.connections) {
      if (conn.subscriptions.has(channel) || conn.subscriptions.has("*")) {
        try {
          socket.write(frame);
        } catch (err) {
          console.error(
            `[ws-event-bus] Failed to send to client on channel "${channel}":`,
            err,
          );
          this.removeConnection(socket);
        }
      }
    }
  }

  /**
   * Get the active channel names.
   */
  getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get the number of connected WebSocket clients.
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Stop the WebSocket server. Gracefully closes all connections.
   */
  stop(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    // Gracefully close all WebSocket connections
    const closeFrame = encodeCloseFrame(1001); // Going Away
    for (const [socket] of this.connections) {
      try {
        socket.write(closeFrame);
        socket.destroy();
      } catch {
        // Best effort
      }
    }
    this.connections.clear();
    this.channels.clear();

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.started = false;
    console.log("[ws-event-bus] WebSocket server stopped");
  }

  /**
   * Whether the server is currently started.
   */
  isStarted(): boolean {
    return this.started;
  }

  /**
   * Get the port the server is listening on.
   */
  getPort(): number {
    return this.port;
  }

  // -----------------------------------------------------------------------
  // Internal: WebSocket handshake
  // -----------------------------------------------------------------------

  private handleUpgrade(req: IncomingMessage, socket: Socket): void {
    if (req.headers.upgrade?.toLowerCase() !== "websocket") {
      socket.destroy();
      return;
    }

    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = computeAcceptKey(key);

    const responseLines = [
      "HTTP/1.1 101 Switching Protocols",
      `Upgrade: websocket`,
      `Connection: Upgrade`,
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "",
      "",
    ];

    socket.write(responseLines.join("\r\n"));

    const conn: WsConnection = {
      socket,
      subscriptions: new Set(),
      handshakeComplete: true,
      lastPong: Date.now(),
      missedPongs: 0,
    };

    this.connections.set(socket, conn);

    let buffer = Buffer.alloc(0);

    socket.on("data", (data: Buffer) => {
      buffer = Buffer.concat([buffer, data]);
      const result = parseFrames(buffer);
      buffer = result.remaining;

      for (const raw of result.messages) {
        this.handleMessage(socket, conn, raw);
      }
    });

    socket.on("close", () => {
      this.removeConnection(socket);
    });

    socket.on("error", (err: Error) => {
      console.warn("[ws-event-bus] Socket error:", err.message);
      this.removeConnection(socket);
    });
  }

  private handleMessage(socket: Socket, conn: WsConnection, raw: string): void {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      console.warn("[ws-event-bus] Invalid JSON message from client");
      return;
    }

    switch (msg.type) {
      case "subscribe": {
        if (msg.channel) {
          conn.subscriptions.add(msg.channel);
          console.log(`[ws-event-bus] Client subscribed to "${msg.channel}"`);
        }
        break;
      }
      case "unsubscribe": {
        if (msg.channel) {
          conn.subscriptions.delete(msg.channel);
          console.log(`[ws-event-bus] Client unsubscribed from "${msg.channel}"`);
        }
        break;
      }
      case "pong": {
        conn.lastPong = Date.now();
        conn.missedPongs = 0;
        break;
      }
      case "ping": {
        // Client-initiated ping — respond with pong
        try {
          socket.write(encodePongFrame());
        } catch {
          // Socket may be closed
        }
        break;
      }
      default: {
        console.warn(`[ws-event-bus] Unknown message type: ${msg.type}`);
      }
    }
  }

  private removeConnection(socket: Socket): void {
    this.connections.delete(socket);
    try {
      socket.destroy();
    } catch {
      // Best effort
    }
  }

  // -----------------------------------------------------------------------
  // Internal: Ping/pong heartbeat
  // -----------------------------------------------------------------------

  private startPingLoop(): void {
    this.pingTimer = setInterval(() => {
      const pingFrame = encodePingFrame();
      const now = Date.now();

      for (const [socket, conn] of this.connections) {
        // Check for dead connections
        if (
          conn.lastPong > 0 &&
          now - conn.lastPong > this.pingInterval * 2
        ) {
          conn.missedPongs++;
          if (conn.missedPongs >= this.maxMissedPongs) {
            console.warn("[ws-event-bus] Dead connection detected — closing");
            this.removeConnection(socket);
            continue;
          }
        }

        try {
          socket.write(pingFrame);
        } catch {
          this.removeConnection(socket);
        }
      }
    }, this.pingInterval);

    if (this.pingTimer && typeof this.pingTimer.unref === "function") {
      this.pingTimer.unref();
    }
  }
}

/** Singleton instance for the application. */
let instance: WebSocketEventBus | null = null;

/**
 * Get or create the singleton WebSocketEventBus.
 */
export function getWebSocketEventBus(options?: EventBusOptions): WebSocketEventBus {
  if (!instance) {
    instance = new WebSocketEventBus(options);
  }
  return instance;
}

/**
 * Dispose the singleton. Used during app shutdown.
 */
export function disposeWebSocketEventBus(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}
