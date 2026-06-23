# F-004 — Terminal Bridge

> Role: product-manager | Related decisions: PM-01, PM-05

## Architecture

Terminal Bridge provides the embedded terminal experience within the GUI. Per PM-01, the product is a terminal companion, not a replacement — Terminal Bridge exists to give users visibility into what maestro is doing behind the scenes, not to replace their primary terminal.

The embedded terminal serves two purposes:
1. **Transparency**: Users see real-time CLI output from maestro workflows, building trust in automated actions (SA-05).
2. **Escape hatch**: Advanced users can interact with the maestro CLI directly when the GUI does not cover their use case.

Terminal Bridge is architecturally a consumer of F-005 (State Sync Engine) for structured state data, and it directly renders the raw PTY stream via xterm.js. The product decision here is about scope — the embedded terminal MUST NOT attempt to be a full-featured terminal emulator.

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| PTY Stream | Consumes | WebSocket binary stream from node-pty backend (SA-05) |
| User Input | Emits | Keystrokes forwarded to PTY process via WebSocket |
| Process Lifecycle | Consumes | Events from F-005 — process start, exit, error |

## Constraints (RFC 2119)

- Terminal Bridge MUST display real-time CLI output via xterm.js + WebSocket (SA-05).
- The embedded terminal MUST NOT attempt to replace the user's primary terminal or code editor (PM-01, PM-05).
- Terminal Bridge SHOULD support basic terminal interactions (scroll, copy, search) but MUST NOT replicate full terminal emulator features (tabs, split panes, profile management).
- The terminal MUST reflect the state of maestro subprocesses managed by the backend, not arbitrary shell sessions.
- Users MUST be able to see what commands are being executed on their behalf by automated workflows.

## Test Approach

- **Unit**: WebSocket stream rendering — verify that PTY output is correctly displayed in xterm.js.
- **Integration**: Workflow execution visibility — trigger a workflow in F-001, verify that the terminal panel shows the corresponding CLI output.
- **E2E**: User watches a workflow execute in the terminal, sees the completion message, and the status updates in Project Radar.
- **Edge case**: Long-running process — verify that the terminal handles continuous output without performance degradation.

## TODOs

- Define the scope of terminal interactivity — can users type arbitrary commands, or is it read-only for managed processes?
- Specify how the terminal panel coexists with the AI Dialog and Workflow Commander panels in the right content area (UI-04).
- Determine whether the terminal supports multiple concurrent process views.
