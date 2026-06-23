# F-005 — State Sync Engine

> Role: system-architect | Related decisions: SA-03

## Architecture

State Sync Engine is the backbone real-time event distribution system. It implements the event-driven + WebSocket architecture mandated by SA-03.

1. **Event Bus (Server-side)**: An in-process EventEmitter-based pub/sub system. All backend services (Workflow Commander, Project Radar, AI Dialog, Terminal Bridge) publish domain events to the bus. The bus supports typed channels: `workflow:*`, `project:*`, `dialog:*`, `terminal:*`.

2. **WebSocket Gateway**: Manages persistent WebSocket connections from the browser. Subscribes to the Event Bus and serializes events to JSON for transmission. Implements a simple subscription protocol so clients can filter events by channel.

3. **Event Store (Write-ahead log)**: An in-memory ring buffer that retains the last N events per channel. This enables new WebSocket connections to replay recent events upon connection, avoiding the "cold start" problem where a freshly connected client sees no state.

4. **Consistency Checkpoint**: Periodic (every 30s) full-state snapshot published on a dedicated `state:snapshot` channel. Clients use this to reconcile any missed events.

Module layout:
```
server/
  core/
    event-bus.ts                  # typed pub/sub
    ws-gateway.ts                 # WebSocket server + subscription protocol
    event-store.ts                # ring buffer + replay
    snapshot-service.ts           # periodic state snapshots
  types/
    events.ts                     # typed event definitions
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `EventBus.publish(channel, event)` | Internal | `event: { type: string, timestamp: number, payload: unknown }` |
| `EventBus.subscribe(channel, handler)` | Internal | Returns `() => void` (unsubscribe) |
| `WS connect: /ws` | Frontend -> Backend | Query param `channels=workflow,project` for subscription |
| `WS message: subscribe` | Frontend -> Backend | `{ op: "subscribe", channels: string[] }` |
| `WS message: event` | Backend -> Frontend | `{ channel, event }` (same shape as EventBus event) |
| `WS message: snapshot` | Backend -> Frontend | `{ channel, fullState: unknown }` |

Consumers: All frontend features subscribe to relevant channels. Backend services publish events.

## Constraints (RFC 2119)

- The Event Bus MUST deliver events to all subscribed WebSocket clients within 100ms of publication.
- The WebSocket Gateway MUST support at least 10 concurrent connections (single-user local app).
- Events MUST NOT be dropped under normal operation; the ring buffer MUST retain at least the last 1000 events per channel.
- The snapshot service MUST publish a full-state snapshot every 30 seconds on each active channel.
- The WebSocket connection MUST implement heartbeat (ping/pong) with a 30-second interval to detect stale connections.
- Event ordering within a channel MUST be preserved (FIFO); cross-channel ordering is NOT guaranteed.
- The gateway MUST replay up to 100 recent events per channel upon a new WebSocket connection.

## Test Approach

- **Unit**: EventBus pub/sub with typed channels; verify delivery order and no-drop guarantee.
- **Integration**: Event publish -> WebSocket delivery -> client receive, measured latency under load.
- **Recovery**: WebSocket disconnect mid-stream -> reconnect -> replay recent events -> verify state consistency.
- **Stress**: 1000 events/second burst on a single channel to verify ring buffer behavior.

## TODOs

- Decide on WebSocket library: `ws` vs `socket.io` (prefer `ws` for lighter weight).
- Determine whether the ring buffer needs disk persistence for crash recovery.
- Define the exact event type taxonomy for each channel.
- Evaluate whether a state reconciliation protocol (CRDT-like) is needed for the snapshot mechanism.
