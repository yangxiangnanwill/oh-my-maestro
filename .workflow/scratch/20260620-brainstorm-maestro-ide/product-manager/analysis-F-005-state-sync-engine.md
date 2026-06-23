# F-005 — State Sync Engine

> Role: product-manager | Related decisions: PM-03, PM-01

## Architecture

State Sync Engine is the technical backbone that enables the product's core value proposition of real-time status visualization (PM-03). From the product perspective, this feature is critical because it directly determines whether users can trust the GUI to reflect reality.

The key product concern is the "state sync desync" pitfall identified in design research: if the GUI shows stale data because the user ran a maestro command in their external terminal, trust is broken. The State Sync Engine MUST handle this scenario gracefully.

Per SA-03, the architecture is event-driven with WebSocket. The product requirement is that state changes MUST propagate to the GUI within a timeframe that feels instantaneous to the user (sub-second for active workflows, near-real-time for external changes).

> **Cross-Role Synergy (S-002)**: State sync accuracy metric (99% within 5s) aligns with SA dual-source model and UX 500ms latency bar — unified acceptance criteria

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| State Events | Emits | WebSocket broadcast — `{ type, project, milestone?, phase?, step?, status, timestamp }` |
| State Query | Consumes | `GET /api/state/{project}` — current snapshot for initial load or reconnection |
| File Watcher | Consumes | Backend file system watcher for maestro state files — detects external CLI changes |

## Constraints (RFC 2119)

- State changes MUST propagate to the GUI via WebSocket in real-time (SA-03).
- The engine MUST detect state changes caused by external CLI usage (user running maestro in their own terminal) and reflect them in the GUI.
- State Sync Engine MUST NOT rely solely on file polling — event-driven updates are required for active workflows (SA-03).
- The engine SHOULD provide a state snapshot API for initial page load and reconnection scenarios.
- State events MUST be idempotent — duplicate events MUST NOT cause incorrect UI state.

## Test Approach

- **Unit**: Event emission — verify that a maestro state file change triggers the correct WebSocket event.
- **Integration**: Cross-terminal state sync — user runs a maestro command in an external terminal, verify the GUI updates within seconds.
- **E2E**: User triggers a workflow in the GUI, watches real-time status updates, then runs a command in their terminal, and sees both reflected correctly.
- **Edge case**: Network interruption — verify that the GUI reconnects and receives a state snapshot, not missing events.

## TODOs

- Define the acceptable latency threshold for external CLI change detection.
- Specify the reconnection protocol — snapshot + delta or full state replacement.
- Determine the event granularity — per-step, per-phase, or per-milestone events.
