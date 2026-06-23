# Design Research: IDE-like GUI Wrapper for CLI-based AI Workflow Tool

## Key Findings

- **VS Code extension is the dominant pattern for AI dev tools**: Cline, Continue.dev, and Claude Code's own extension all chose VS Code as their primary surface. This gives instant access to the editor, terminal, file tree, and LSP without rebuilding. (confidence: HIGH)
- **Standalone apps fork VS Code (Cursor, Windsurf) rather than build from scratch**: Both Cursor and Windsurf are Electron-based forks of VS Code's open-source codebase. They patch the extension host and editor core to inject AI capabilities. This is extremely high engineering cost but delivers a seamless experience. (confidence: HIGH)
- **Web UI wrapping a local CLI is the fastest path to MVP**: Open WebUI and Aider's browser mode both use a local server + browser frontend pattern. This avoids desktop packaging entirely and leverages web-native visualization. (confidence: HIGH)
- **Terminal integration is the critical technical challenge**: All approaches that wrap CLI tools must solve pseudoterminal (pty) management. VS Code extensions use `vscode.window.createTerminal` / Pseudoterminal API; Electron apps use `node-pty`; web apps use `xterm.js` + WebSocket bridge to a backend pty. (confidence: HIGH)
- **Tauri 2.0 is production-ready for developer tools**: Smaller bundle (~5-15MB vs 150MB+ Electron), native webview, Rust backend. Trade-off: smaller ecosystem, no node.js in backend (must use Rust sidecar or HTTP bridge to a Node process). (confidence: MEDIUM)

## API / Technology Details

- **xterm.js**: v5.x, full terminal emulator for the browser
  - Integration: WebSocket to backend pty process; addon ecosystem (fit, web-links, search)
  - Caveats: No built-in pty -- requires server-side component (node-pty or forked process)
- **node-pty**: Node.js bindings for pseudoterminals
  - Integration: `pty.spawn()` to create PTY; pipe data to xterm.js via WebSocket
  - Caveats: Native module, requires compilation; Windows conpty issues possible
- **VS Code Extension API**: Pseudoterminal, WebviewView, TreeDataProvider
  - Integration: `vscode.Pseudoterminal` for custom terminal; `vscode.window.registerTreeDataProvider` for sidebar views; Webview for custom UI panels
  - Caveats: Limited to VS Code's extension host; no access to editor DOM; Webview is sandboxed
- **Tauri 2.0**: Rust backend + system webview frontend
  - Integration: `tauri::command` for IPC; sidecar for running Node.js processes; shell plugin for CLI execution
  - Caveats: Must manage CLI process lifecycle in Rust; no direct node-pty equivalent (use sidecar + HTTP/WS)

## Reference Projects / Implementations

### Cline (formerly Claude Dev)
VS Code extension that wraps Claude API for autonomous coding.
- Architecture: VS Code extension with sidebar panel; uses VS Code's Pseudoterminal API to execute CLI commands; manages file edits through VS Code's workspace API; Diff view for approval flow
- Key pattern: **Agent-in-sidebar with approval gate** -- AI proposes actions, user approves/denies each step
- Key pattern: **Terminal delegation** -- Cline calls Claude API and then executes the suggested commands via VS Code terminal. This is API-level integration, not CLI wrapping.

### Continue.dev
Open-source AI coding assistant as VS Code / JetBrains extension.
- Architecture: Extension frontend (React in Webview) + extension backend (Node.js) + configurable LLM providers
- Key pattern: **Provider abstraction** -- Config-based model routing that maps capabilities to providers
- Key pattern: **Slash command extensibility** -- Custom commands defined in config, similar to maestro's workflow system

### Cursor
Standalone AI IDE, fork of VS Code.
- Architecture: Fork of VS Code's open-source codebase; modifies the editor core to integrate AI features natively; Electron-based
- Key pattern: **Deep fork with selective patching** -- Cursor maintains a living fork of VS Code. Extremely high maintenance cost.
- Key pattern: **Tab-level AI awareness** -- Each open tab has AI context; cursor position and surrounding code are automatically sent as context.

### Open WebUI
Web-based chat interface for Ollama/OpenAI-compatible LLMs.
- Architecture: SvelteKit frontend + FastAPI (Python) backend; backend connects to Ollama API; manages conversations, documents, and model switching
- Key pattern: **Local-first web app** -- Runs entirely on localhost; browser is the UI surface; backend orchestrates CLI/API calls
- Key pattern: **Progressive enhancement** -- Core is chat UI; adds RAG, document upload, function calling, and model management as layered features

### Windsurf (Codeium)
AI IDE, VS Code fork with "Cascade" agent flow.
- Architecture: VS Code fork with AI agent system ("Cascade") that maintains conversation + action history; "Flow awareness" tracks what user has done across files
- Key pattern: **Cascade agent architecture** -- Multi-step agent that plans, executes, and iterates; surfaces intermediate steps to user; allows intervention at any point

## Extractable Patterns

### Agent-Sidebar Pattern (Cline, Continue, GitHub Copilot Chat)
AI interaction lives in a sidebar panel; user types instructions, sees streaming response, approves actions.
Applicability: Best when AI is an assistant alongside code editing; works as VS Code extension or web panel.
For maestro: the sidebar would list available workflows, show running status, display logs.

### Command Palette / Slash Command Pattern (Continue.dev, Cursor, GitHub Copilot)
User invokes AI capabilities through typed commands with autocomplete and parameter hints.
Applicability: Ideal for CLI-wrapper products -- maps 1:1 to CLI commands but with discoverability.
For maestro: each `maestro` subcommand becomes a slash command; flags become form fields; `--help` output becomes tooltips.

### Approval Gate Pattern (Cline, Claude Code)
AI proposes actions; user reviews diff/plan and approves/rejects before execution.
Applicability: Critical for any autonomous agent; non-negotiable for trust.
For maestro: workflows with `--dry-run` can generate preview; user approves before actual execution.

### Local-Server-Plus-Browser Pattern (Open WebUI, Jupyter, Aider browser mode)
Local process runs HTTP/WS server; browser connects as frontend; CLI tool runs as backend subprocess.
Applicability: Fastest MVP path; cross-platform by default; easy to iterate on UI.
For maestro: CLI runs as subprocess; WebSocket streams stdout/stderr to browser; workflow state polled via REST.

### Deep Fork Pattern (Cursor, Windsurf)
Fork the VS Code codebase and patch AI capabilities directly into the editor.
Applicability: Only for funded teams building a full IDE product; maximum integration at maximum cost.
NOT recommended for maestro wrapper -- too much maintenance overhead.

### Status Tree Pattern (VS Code's Explorer, Git, Test panels)
Hierarchical tree view showing project state; updates in real-time.
Applicability: Directly applicable to visualizing maestro's project state, workflow queue, and execution status.
For maestro: Tree nodes = projects > workflows > steps; icons/badges indicate status.

## Recommended Approach

### Phase 1 (MVP): Local web app with SvelteKit + Node.js backend

Rationale: The fastest path to a usable product is a local web server pattern. Maestro is a CLI tool; wrapping it requires (a) spawning and managing CLI processes, (b) parsing structured output, (c) streaming logs to the UI, and (d) visualizing workflow state. A web app does all of this with the least engineering:

- Node.js backend spawns `maestro` via `child_process` / `node-pty`
- WebSocket streams terminal output to `xterm.js` in browser
- REST API wraps `maestro search`, `maestro status`, `maestro delegate` with structured JSON output
- SvelteKit frontend provides: command palette (slash commands), workflow tree (status visualization), terminal panel (log streaming), chat panel (AI interaction)
- Packaged later with Electron or Tauri for desktop distribution

### Phase 2 (Growth): VS Code extension

Once the core UX is validated, build a VS Code extension using the same backend logic. This captures the largest developer audience.

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Local web app (SvelteKit + Node) | Fastest MVP; cross-platform; rich visualization; no packaging needed; easy to iterate | No editor integration; separate window from code; users must open browser | Recommended for Phase 1 |
| VS Code extension | Largest dev audience; editor integration; terminal/file access; sidebar panel | Limited to VS Code users; sandboxed Webview UI; extension API constraints | Recommended for Phase 2 |
| Tauri desktop app | Small bundle; native feel; Rust performance; can embed web UI | Smaller ecosystem; Rust backend complexity; sidecar for Node/CLI; fewer UI libraries | Viable alternative to Electron packaging |
| Electron desktop app | Full Node.js access; large ecosystem; can embed editor (Monaco); proven pattern (Cursor) | Large bundle (150MB+); high memory; Chromium overhead | Viable for desktop packaging of web app |
| VS Code fork (Cursor pattern) | Maximum editor integration; native AI features; seamless UX | Extreme maintenance cost; must track upstream; team of 5+ needed | Avoid |
| JetBrains plugin | Second-largest IDE audience; powerful IDE APIs | Kotlin API; different architecture; smaller AI tool market | Defer |

## Pitfalls

- **GUI shallowness (wrapping `--help` as menus)**: Simply mapping CLI flags to GUI checkboxes creates a "GUI wrapper" that adds no value over the CLI. The GUI must provide genuine UX improvements.
- **Terminal passthrough without structured output**: If the GUI is just a terminal window showing raw CLI output, users gain nothing. The backend must parse CLI output into structured data (JSON) for visualization.
- **State sync desync**: CLI state can change outside the GUI. The GUI must poll or subscribe to state changes. Without this, the GUI shows stale data and users lose trust.
- **Approval bypass**: If the GUI auto-approves all CLI actions without showing diffs/plans, it removes the safety net.
- **Ignoring CLI power users**: The GUI must not block CLI-native workflows. If a user runs `maestro delegate` in their terminal, the GUI should reflect that state, not conflict with it.
- **Over-building the frontend**: Resist building a full code editor (Monaco) into the web app. The product is a workflow orchestrator, not an IDE. Let users keep their existing editor.
- **Coupling to single Claude Code CLI version**: CLI output format changes break the parser. Abstract CLI output parsing behind an adapter layer; version-pin the CLI; add regression tests.
