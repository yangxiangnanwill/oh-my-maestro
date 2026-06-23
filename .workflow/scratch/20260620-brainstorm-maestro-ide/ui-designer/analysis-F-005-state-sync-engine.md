# F-005 — State Sync Engine

> Role: ui-designer | Related decisions: SA-03, UX-02, UI-03

## Architecture

The State Sync Engine is primarily a backend concern (SA-03), but the UI layer defines the client-side subscription model and event handling. The UI MUST consume WebSocket events and translate them into reactive state updates across all panels.

```
WebSocket Event Flow:

  Backend --[event]--> WS Client --[dispatch]--> Svelte Store
                                                |
                                    +-----------+-----------+
                                    |           |           |
                                StatusTree  WorkflowProgress  DialogStatus
```

The UI maintains a central Svelte store that subscribes to the WebSocket connection. Components derive their state from this store reactively.

## Interface Contract

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| StateSyncClient | `{ wsUrl: string, onEvent: (event: SyncEvent) => void, reconnect: boolean }` | App root |
| SyncEvent | `{ type: 'step_status' | 'workflow_progress' | 'project_state' | 'cli_output', payload: unknown }` | All panels |
| ProjectStore | Svelte writable store derived from SyncEvent stream | F-002, F-001 |
| WorkflowStore | Svelte writable store derived from SyncEvent stream | F-001, F-007 |

The StateSyncClient MUST handle connection lifecycle: connect, reconnect on disconnect, and buffer events during brief interruptions.

## Constraints (RFC 2119)

- The UI MUST subscribe to WebSocket events for all state changes; REST polling MUST NOT be the primary state mechanism.
- The WebSocket client MUST implement automatic reconnection with exponential backoff.
- State updates MUST be reflected in the UI within 2 seconds of the event arriving.
- The UI MUST handle stale state gracefully: if a WebSocket disconnect occurs, components MUST display a "Connection lost" indicator and resume when reconnected.
- The SyncEvent type taxonomy MUST cover: step_status, workflow_progress, project_state, cli_output.
- The UI MUST NOT assume event ordering; events MAY arrive out of sequence and the store MUST reconcile them.

## Test Approach

- Unit: StateSyncClient reconnects after disconnect; store updates correctly from event payloads.
- Integration: Full round-trip from backend state change to UI component re-render.
- Edge case: Rapid event bursts (throttling); out-of-order events; connection drop during workflow execution.

## TODOs

- Define the complete SyncEvent schema with all payload types.
- Specify the reconnection strategy parameters (backoff range, max retries).
- Design the "Connection lost" indicator component and its placement.
- Coordinate with SA on event deduplication and idempotency guarantees.
