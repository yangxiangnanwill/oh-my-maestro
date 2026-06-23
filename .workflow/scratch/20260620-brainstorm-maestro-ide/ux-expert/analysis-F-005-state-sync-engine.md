# F-005 — State Sync Engine

> Role: ux-expert | Related decisions: SA-03, UX-02, UX-06

## Architecture

The State Sync Engine is the real-time event backbone. From a UX perspective, this feature is invisible infrastructure — users never interact with it directly, but every visual state update depends on it. The UX mandate for F-005 is ensuring the engine supports the interaction quality requirements of all consumer features.

The engine MUST deliver state-change events via WebSocket (SA-03) with sufficient granularity to support:
- Project Radar (F-002) — milestone/stage/step status transitions with recommended next actions.
- Workflow Commander (F-001) — step progress updates and approval gate triggers.
- Terminal Bridge (F-004) — CLI process lifecycle events (start, output, exit).

The event model MUST distinguish between ephemeral events (terminal output chunks, progress ticks) and stateful events (step completion, workflow finish, approval required). Stateful events MUST carry enough data to reconstruct the current project state without replaying history.

## Interface Contract

- **StateChangeEvent**: `{ type: 'workflow'|'step'|'process'|'approval', action: 'started'|'progress'|'completed'|'failed'|'awaiting_approval', payload: Record<string,unknown>, timestamp }`. Consumed by F-001, F-002, F-003, F-004.
- **ConnectionState**: `{ status: 'connected'|'reconnecting'|'disconnected', lastEventTimestamp }`. MUST be exposed to all panels for disconnection handling.

## Constraints (RFC 2119)

- Stateful events MUST arrive within 500ms of the underlying state change to maintain real-time perception per UX-02.
- The engine MUST NOT drop events during transient WebSocket disconnections; it MUST buffer and replay missed events on reconnection.
- Ephemeral events (terminal output) MAY be dropped during reconnection to avoid overwhelming the client with stale output.
- The connection state MUST be visually indicated across all panels — a disconnected state MUST NOT silently show stale data.
- Event payloads MUST use translated terminology (per F-006 Concept Translator) in their user-facing fields while preserving raw technical terms in a separate `raw` field for advanced mode.

## Test Approach

- **Integration**: Simulate WebSocket disconnection mid-workflow; verify reconnection replays stateful events and client UI converges to correct state.
- **Latency**: Measure end-to-end latency from CLI state change to UI update across all consumer features.
- **Stress**: Test with rapid state changes (fast-executing workflow steps) to verify event ordering and deduplication.

## TODOs

- Define the event taxonomy and granularity in collaboration with the System Architect.
- Specify the reconnection buffering strategy and replay protocol.
- Design the cross-panel connection state indicator pattern.
