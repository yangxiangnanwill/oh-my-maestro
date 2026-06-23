# F-004 — Terminal Bridge

> Role: system-architect | Related decisions: SA-04, SA-05

## Architecture

Terminal Bridge embeds a fully functional terminal emulator in the browser, providing real-time visibility into CLI operations. This is critical for user trust (see SA-05 rationale).

1. **PTY Manager**: Uses `node-pty` to spawn pseudoterminal sessions. Each terminal instance corresponds to one PTY process. The manager handles creation, resize, input forwarding, and destruction.

2. **WebSocket Terminal Channel**: A dedicated WebSocket channel multiplexes terminal I/O. Input from xterm.js is sent as `term:input` events; output from the PTY is sent back as `term:output` events. Window resize events are forwarded as `term:resize`.

3. **Process Lifecycle Controller**: Tracks the state of each PTY process (spawning, running, exited, crashed). Exposes process health via REST and propagates state changes through the shared WebSocket.

Module layout:
```
server/
  services/
    pty-manager.service.ts       # node-pty lifecycle
    terminal-channel.service.ts   # WS multiplexing
  models/
    terminal-session.ts           # PTY state model
client/
  components/
    terminal/
      TerminalView.svelte         # xterm.js wrapper
      terminal-input.svelte       # input capture + resize handling
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `POST /api/terminals` | Frontend -> Backend | `{ cwd?: string, command?: string }` returns `{ terminalId }` |
| `DELETE /api/terminals/:id` | Frontend -> Backend | Kills PTY process, returns `{ exitCode }` |
| `WS event: term:output` | Backend -> Frontend | `{ terminalId, data: string }` (raw PTY output) |
| `WS event: term:input` | Frontend -> Backend | `{ terminalId, data: string }` (keystrokes) |
| `WS event: term:resize` | Frontend -> Backend | `{ terminalId, cols, rows }` |
| `WS event: term:exit` | Backend -> Frontend | `{ terminalId, exitCode }` |

Consumers: AI Dialog (F-003) may pipe freeform session output through a terminal; State Sync Engine (F-005) monitors process lifecycle events.

## Constraints (RFC 2119)

> **Cross-Role Resolution (C-002)**: SA-06 scoped to simple mode — raw CLI text available in advanced mode via dual-stream (annotated + raw) to frontend

- Each terminal MUST use `node-pty` for PTY allocation; `child_process.spawn` without PTY MUST NOT be used for interactive sessions (xterm.js requires a full PTY).
- Terminal output MUST be streamed to xterm.js within 30ms of PTY output to maintain real-time feel.
- The backend MUST enforce a maximum of 5 concurrent terminal sessions per user to limit resource consumption.
- Terminal sessions MUST be cleaned up (PTY killed, resources freed) within 5 seconds of WebSocket disconnect.
- The PTY manager MUST handle Windows conpty quirks gracefully; it SHOULD log conpty-specific errors without crashing.
- The backend SHOULD propagate terminal resize events to the PTY within 100ms.

## Test Approach

- **Unit**: PTY manager spawn/kill cycle with mock node-pty.
- **Integration**: Full round-trip: keystroke -> WebSocket -> PTY input -> PTY output -> WebSocket -> xterm.js render.
- **Platform**: Windows conpty compatibility tests (line endings, color support, resize).
- **Stress**: Rapid resize events and large output bursts (e.g., `find / -type f`) to verify no data loss.

## TODOs

- Investigate Windows conpty known issues and required workarounds for node-pty.
- Determine whether xterm.js addons (fit, web-links, search) are included in MVP scope.
- Evaluate whether terminal sessions need persistence (reattach after browser refresh).
- Define the multiplexing strategy: one WebSocket connection with channel IDs vs. one WebSocket per terminal.
