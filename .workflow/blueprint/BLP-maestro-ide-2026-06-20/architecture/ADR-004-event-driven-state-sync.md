# ADR-004: Event-Driven + WebSocket State Synchronization

> Status: Accepted
> Date: 2026-06-20
> Deciders: System Architect, Product Manager
> Related Constraints: C-005

## Context

Maestro IDE has five frontend features that depend on real-time state updates:

- **F-001 Workflow Commander**: Step-level progress, completion, and error events
- **F-002 Project Radar**: Project state changes from file-system mutations and workflow executions
- **F-003 AI Dialog**: Streaming output chunks and intent routing results
- **F-004 Terminal Bridge**: Raw PTY output bytes in real-time
- **F-007 Approval Gate**: Gate creation, resolution, and expiry events

The user experience requirement (C-009, C-010) demands that state changes appear in the UI within 500ms of occurrence. The acceptance criteria for F-005 specifies 500ms event-to-UI latency and 99% accuracy.

We must decide the state synchronization mechanism between the Node.js backend and the browser frontend.

## Decision

We WILL adopt an **event-driven architecture with WebSocket state synchronization**:

1. **Event Bus (Backend)**: An in-process, typed pub/sub system based on Node.js `EventEmitter`. All backend services publish domain events to named channels (`workflow:*`, `project:*`, `dialog:*`, `terminal:*`, `gate:*`).

2. **WebSocket Gateway (Backend)**: Persistent WebSocket connections from the browser. The gateway subscribes to the Event Bus and serializes events to JSON for transmission. Implements a simple subscription protocol so clients can filter events by channel.

3. **Event Store (Backend)**: An in-memory ring buffer retaining the last N events per channel. Enables new connections to replay recent events, avoiding the "cold start" problem.

4. **Snapshot Service (Backend)**: Periodic (every 30s) full-state snapshots on a dedicated `state:snapshot` channel. Clients use this to reconcile any missed events.

5. **Client-Side Stores (Frontend)**: Svelte stores that subscribe to WebSocket events and update reactive state. Components bind to stores; DOM updates are automatic.

```
Backend Service -> EventBus.publish(channel, event)
                       |
                       v
                  Event Store (ring buffer)
                       |
                       v
                  WebSocket Gateway -> JSON over WS -> Browser
                                                          |
                                                          v
                                                  Svelte Store -> Component
```

## Alternatives Considered

### 1. HTTP Polling

**Pros**:
- Simple implementation: `setInterval(() => fetch('/api/state'), 5000)` on the frontend
- No WebSocket connection management; works through proxies and firewalls
- Easy to debug: standard HTTP requests visible in browser DevTools
- No connection state to manage (connect, disconnect, reconnect)

**Cons**:
- **Latency**: Polling introduces average latency of `interval / 2`. For 5-second intervals, average latency is 2.5 seconds. To meet the 500ms latency requirement, polling interval must be <= 1 second, creating excessive HTTP overhead.
- **Wasted requests**: Most polls return no new data. For a local app where state changes are event-driven, 95%+ of polls are wasteful.
- **No push capability**: The server cannot proactively notify the client. Terminal output streaming and AI dialog streaming require push semantics; polling is fundamentally unsuitable.
- **Thundering herd**: All connected tabs poll simultaneously, creating request bursts on the server.
- **Inconsistent with architecture**: The backend is already event-driven (EventBus). Polling adds an unnecessary translation layer from events to request/response.

**Verdict**: Rejected. Polling cannot meet the 500ms latency requirement without excessive overhead, and it fundamentally cannot support streaming use cases (terminal output, AI dialog).

### 2. Server-Sent Events (SSE)

**Pros**:
- Simpler than WebSocket: unidirectional server-to-client push over HTTP
- Auto-reconnect built into the browser EventSource API
- Works through HTTP/2 and proxies
- No custom protocol needed: standard `text/event-stream` content type

**Cons**:
- **Unidirectional only**: SSE supports server-to-client push but not client-to-server messages. Terminal input (`term:input`), approval decisions (`POST /api/gates/:id/approve`), and dialog messages require client-to-server communication, which SSE cannot provide.
- **No binary support**: SSE is text-only. Terminal output often contains binary-like data (ANSI escape codes, control characters) that requires base64 encoding, adding overhead.
- **Connection per channel**: SSE typically requires one connection per event stream. With 5 channels (workflow, project, dialog, terminal, gate), this means 5 concurrent HTTP connections per tab.
- **No multiplexing**: Each SSE connection is independent; no subscription protocol to filter events.

**Verdict**: Rejected for primary state sync. SSE could be used for read-only channels (project:state-update) but the unidirectional limitation makes it insufficient for the full architecture. The Terminal Bridge and AI Dialog require bidirectional communication.

### 3. Hybrid: SSE for Push + HTTP for Actions

**Pros**:
- Uses the right tool for each direction: SSE for server push, HTTP POST for client actions
- Simpler than WebSocket for server push (auto-reconnect, no custom protocol)
- Standard HTTP for mutations (POST /api/gates/:id/approve)

**Cons**:
- **Two connection models**: Frontend must manage both SSE connections and HTTP requests. More complex than a single WebSocket connection.
- **No streaming input**: Terminal keystrokes cannot be sent over SSE. A separate mechanism (HTTP POST per keystroke? WebSocket for terminal only?) would be needed, creating an inconsistent architecture.
- **Connection proliferation**: 5 SSE channels + HTTP requests per tab. More connections to manage than a single multiplexed WebSocket.
- **Inconsistent programming model**: Developers must think about "which protocol for which operation" instead of a unified channel model.

**Verdict**: Rejected. The hybrid model adds complexity without clear benefit over a unified WebSocket approach for a local application where proxy/firewall concerns are irrelevant.

### 4. WebSocket with Socket.io

**Pros**:
- Built-in reconnection, rooms, namespaces, and event acknowledgement
- Automatic fallback to HTTP long-polling for environments where WebSocket is blocked
- Rich ecosystem: typed events, middleware, adapter for horizontal scaling

**Cons**:
- **Unnecessary abstraction**: Socket.io adds ~30KB to the client bundle for features (rooms, namespaces, fallback) that a single-user local app does not need.
- **Protocol overhead**: Socket.io wraps WebSocket with its own packet format (engine.io + socket.io protocol), adding parsing overhead per message.
- **No fallback needed**: A local app on localhost will always have WebSocket support. The HTTP long-polling fallback is dead weight.
- **Library lock-in**: Socket.io client and server must use compatible versions. The `ws` library uses the standard WebSocket protocol, allowing any client to connect.

**Verdict**: Rejected. Socket.io's features (rooms, namespaces, fallback) are designed for deployed applications with scalability and compatibility concerns. For a local single-user app, the `ws` library provides the same core functionality with less overhead and no lock-in.

## Consequences

### Positive

- **Meets latency requirement**: WebSocket push delivers events within 100ms (backend target) + network latency (~1ms on localhost). Well within the 500ms end-to-end requirement.
- **Unified programming model**: All real-time communication flows through one WebSocket connection per browser tab. Frontend developers use one API (subscribe to channels, receive events).
- **Efficient for streaming**: Terminal output and AI dialog streaming are natural fits for WebSocket's bidirectional, low-latency message delivery.
- **Event replay**: The Event Store ring buffer enables new connections (browser refresh, new tab) to replay recent events without a full state reload.
- **State reconciliation**: Periodic snapshots provide a "ground truth" that clients can use to reconcile missed events, preventing drift.
- **Backpressure awareness**: The Event Bus can monitor WebSocket send buffer sizes and apply backpressure if a client cannot keep up (though unlikely on localhost).

### Negative

- **Connection management**: The frontend must handle WebSocket connect, disconnect, reconnect, and subscription state. This is boilerplate that must be implemented correctly.
- **Event ordering**: FIFO is guaranteed within a channel, but cross-channel ordering is not. The frontend must not assume causal ordering between events on different channels.
- **Memory usage**: The Event Store ring buffer retains up to 1000 events per channel in memory. For 5 channels, this is up to 5000 events in memory. Acceptable for a local app but must be monitored.
- **Snapshot staleness**: The 30-second snapshot interval means a freshly connected client may see state that is up to 30 seconds old before the next snapshot. Mitigated by event replay on connection.
- **No offline support**: WebSocket requires an active connection. If the server is down, the frontend cannot show any data. Acceptable for a local app.

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebSocket connection drops frequently | Low | Medium | Auto-reconnect with exponential backoff; event replay on reconnect |
| Event store memory grows unbounded | Low | Low | Ring buffer with configurable size (default 1000); oldest events evicted |
| Cross-channel event ordering causes UI inconsistency | Medium | Low | Clients use snapshots for reconciliation; cross-channel ordering not guaranteed by design |
| Snapshot interval too long for fast-changing state | Low | Medium | Clients receive event stream + snapshot; events fill the gap between snapshots |
| WebSocket library (`ws`) lacks features needed later | Low | Low | `ws` is the de facto standard; can migrate to socket.io if needed without changing Event Bus |

## References

- SA-03: Event-driven + WebSocket state sync decision
- C-005: State sync MUST use event-driven WebSocket architecture; polling MUST NOT be used
- F-005 State Sync Engine: Architecture, Interface Contract, Constraints
- Finding: CLI-GUI State Desynchronization (dual-source state model)
