# F-004 — Terminal Bridge

> Role: ux-expert | Related decisions: SA-05, UX-04, PM-01

## Architecture

The Terminal Bridge embeds xterm.js to provide real-time CLI output visualization. Per PM-01, the product is a terminal companion, not a replacement, so the Terminal Bridge serves as a read-and-monitor surface with limited write capability. The architecture follows:

1. **Output Display** — xterm.js canvas connected via WebSocket to a node-pty backend. The terminal MUST stream CLI output in real-time per SA-05. Design research confirms xterm.js v5.x with fit, web-links, and search addons is the standard approach.
2. **Input Gateway** — Simple mode MUST restrict direct terminal input to prevent users from issuing raw maestro commands accidentally. Advanced mode (UX-04) SHOULD allow full terminal input for power users.
3. **Output Annotation** — The terminal MUST overlay structured annotations on recognized CLI output patterns (e.g., success/failure badges on completed steps, status indicators). This transforms raw CLI output into meaningful status feedback without hiding the terminal view.

The Local-Server-Plus-Browser Pattern from design research (Open WebUI, Jupyter) is the architectural foundation: local HTTP/WS server streams PTY data to the browser.

> **Cross-Role Resolution (C-002)**: Advanced mode CAN show raw CLI output — SA-06 constraint scoped to simple mode only; dual-stream architecture supports both

## Interface Contract

- **TerminalStream**: WebSocket channel `terminal:{sessionId}`. Bidirectional — receives PTY output chunks, sends user input (in advanced mode). Data format: `{ type: 'output'|'input', data: string, timestamp }`.
- **AnnotatedOutput**: `{ line: number, annotation: { type: 'status'|'warning'|'error', label, icon } }`. Overlays are computed client-side from parsed CLI output, not server-side.

## Constraints (RFC 2119)

> **Cross-Role Synergy (S-003)**: Windows ConPTY limits (SIGTSTP unreliable, resize errors) must inform terminal interaction design — use SIGINT for stop, add resize error recovery

- Terminal output MUST render within 100ms of receiving a PTY data chunk to maintain the perception of real-time output.
- Simple mode MUST NOT present a writable terminal prompt by default; input MUST be restricted to the AI Dialog (F-003) or Workflow Commander (F-001).
- Advanced mode MUST allow full terminal input, including raw maestro commands, but SHOULD display a warning badge indicating "expert mode" is active.
- The terminal MUST auto-scroll to the latest output but MUST stop auto-scrolling when the user manually scrolls up, resuming auto-scroll only when the user scrolls back to the bottom.
- Output annotations MUST NOT obscure or replace the underlying CLI text; they MUST appear as non-intrusive overlays in the gutter or margin.

## Test Approach

- **Unit**: Output annotation parser — verify correct annotation of known CLI output patterns (step start, step complete, error messages).
- **Integration**: WebSocket streaming latency test — measure end-to-end delay from PTY output to xterm.js render.
- **Usability**: Observe whether users in simple mode attempt to type in the terminal; measure confusion incidents.
- **Edge case**: Test with high-volume CLI output (e.g., build logs) to verify scroll performance and annotation accuracy under load.

## TODOs

- Define the annotation parsing rules for maestro CLI output patterns.
- Design the simple/advanced mode toggle UX for terminal input permissions.
- Specify the behavior when the user runs a maestro command in their external terminal — how does the Terminal Bridge reflect that state.
- Determine auto-scroll threshold and "new output" indicator pattern when user has scrolled up.
