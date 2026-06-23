# F-004 — Terminal Bridge

> Role: ui-designer | Related decisions: UI-04, SA-05, PM-01

## Architecture

The Terminal Bridge panel occupies the right content area when the "Terminal" tab is active. It embeds an xterm.js instance connected to a backend PTY via WebSocket, following the Local-Server-Plus-Browser pattern from design-research.

```
+-------------------------------------------+
| [Workflow] [Dialog] [Terminal]   <- tabs  |
+-------------------------------------------+
| +-- Process Bar --+                       |
| | [maestro] [bash] [+]|  <- tabs/processes|
| +------------------+                      |
| +-- Terminal Output --+                   |
| | $ maestro status     |                  |
| | Project: Alpha       |                  |
| | Status: In Progress  |                  |
| | $ _                  |  <- cursor       |
| +----------------------+                  |
+-------------------------------------------+
```

The process bar at the top allows switching between active terminal sessions. Each tab represents a separate PTY connection managed by the backend.

## Interface Contract

> **Cross-Role Synergy (S-003)**: xterm.js resize and multi-session tabs must handle Windows ConPTY quirks — add platform-aware resize error recovery per SA findings

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| TerminalPanel | `{ sessions: TerminalSession[], activeId: string }` | MainContent |
| TerminalView | `{ sessionId: string, wsUrl: string }` | TerminalPanel |
| ProcessTab | `{ id: string, label: string, status: 'running' | 'exited', onClose: () => void }` | ProcessBar |

The TerminalView MUST initialize an xterm.js instance and connect to the backend WebSocket endpoint for the given session. Input from xterm.js MUST be forwarded to the WebSocket; output from the WebSocket MUST be written to xterm.js.

## Constraints (RFC 2119)

- The terminal MUST use xterm.js for rendering, per SA-05.
- Terminal output MUST stream in real-time via WebSocket; buffering or polling MUST NOT be used for output delivery.
- The terminal MUST support multiple concurrent sessions, each in its own tab.
- Each session tab MUST display the process name and running/exited status.
- The terminal MUST support standard interactions: text selection, copy (Ctrl+Shift+C), paste (Ctrl+Shift+V), scrollback.
- The terminal panel MUST NOT intercept keyboard shortcuts that belong to the application-level chrome (e.g., tab switching).
- When a workflow from F-001 spawns a CLI process, the terminal SHOULD auto-switch to the corresponding session tab.
- The terminal MUST support xterm.js fit addon for responsive resizing.

## Test Approach

- Unit: ProcessTab renders correct status indicator; tab switching updates active session.
- Integration: WebSocket connection streams output to xterm.js; keyboard input reaches the backend PTY; session lifecycle (spawn, output, exit) works end-to-end.
- Edge case: Very long output (scrollback buffer); binary output; ANSI color codes; resize handling.
- Accessibility: Terminal content is not screen-reader friendly by nature; provide a "Copy Output" button as an alternative access path.

## TODOs

- Define the scrollback buffer size configuration.
- Specify the xterm.js addon set (fit, web-links, search).
- Design the interaction between F-001 workflow execution and automatic terminal tab creation.
- Coordinate with SA on the WebSocket protocol for PTY data framing.
