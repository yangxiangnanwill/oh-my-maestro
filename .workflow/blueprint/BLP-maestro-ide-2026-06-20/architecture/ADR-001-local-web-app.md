# ADR-001: Local Web App Architecture

> Status: Accepted
> Date: 2026-06-20
> Deciders: System Architect, Product Manager
> Related Constraints: C-003

## Context

Maestro IDE needs a delivery vehicle that wraps the maestro-flow CLI (60+ commands) with a visual interface for developers who are not comfortable with command-line tools. The product must provide workflow orchestration, state visualization, AI dialog, and terminal integration. We must choose the application architecture that best balances MVP speed, cross-platform support, and future extensibility.

The core integration challenge is spawning and managing CLI child processes, parsing their output, streaming terminal data, and pushing real-time state updates to a user interface.

## Decision

We WILL adopt a **local web application architecture**: a Node.js HTTP/WebSocket server running on localhost, with a browser-based SvelteKit frontend. The server binds exclusively to `127.0.0.1:3210` and serves both the static frontend assets and the dynamic API/WebSocket endpoints.

```
Browser (http://localhost:3210)
  |
  +-- SvelteKit Frontend (static assets served by Node.js)
  |
Node.js Backend (localhost:3210)
  |
  +-- HTTP REST API
  +-- WebSocket Gateway
  +-- CLI Child Processes (maestro, Claude Code)
```

## Alternatives Considered

### 1. VS Code Extension

**Pros**:
- Largest developer audience; users already in VS Code
- Native access to editor, terminal, file tree, LSP via Extension API
- Sidebar panel, Webview, Pseudoterminal API for terminal integration
- Distribution via VS Code Marketplace

**Cons**:
- Limited to VS Code users; excludes JetBrains, Vim, Neovim users
- Webview UI is sandboxed; restricted DOM access and communication overhead
- Extension API constraints limit UI flexibility (no custom status bar, limited theming)
- Extension Host process has resource limits and lifecycle constraints
- Debugging and iteration cycle is slower (reload extension, reopen Webview)
- Cannot ship until VS Code Marketplace review; distribution friction

**Verdict**: Recommended for Phase 2, not MVP. The extension API constraints and VS Code-only audience make it suboptimal for rapid validation.

### 2. Tauri Desktop App

**Pros**:
- Small bundle size (~5-15MB vs 150MB+ Electron)
- Native webview (no Chromium bundled)
- Rust backend for performance-critical paths
- Modern IPC architecture (tauri::command)
- Growing ecosystem and plugin support

**Cons**:
- No Node.js in backend; CLI process management requires Rust sidecar or HTTP bridge to a separate Node process
- `node-pty` has no Rust equivalent; must use sidecar + WebSocket bridge, adding complexity
- Smaller ecosystem; fewer UI component libraries and community resources
- Rust learning curve for team members unfamiliar with Rust
- Sidecar pattern (Node.js process alongside Tauri) negates the "no Node.js" benefit
- Tauri 2.0 is relatively new; potential for breaking changes

**Verdict**: Viable alternative for desktop packaging in Phase 3, but the sidecar requirement for node-pty undermines the "no Node.js" advantage. Not optimal for MVP.

### 3. Electron Desktop App

**Pros**:
- Full Node.js access in main process; direct `child_process` and `node-pty` usage
- Large ecosystem; proven pattern (Cursor, Windsurf both use Electron)
- Can embed Monaco editor for code editing
- Cross-platform desktop distribution

**Cons**:
- Large bundle size (150MB+); high memory consumption
- Chromium overhead for a local-only tool
- Desktop packaging and auto-update infrastructure required
- Slower startup than a browser tab
- Overkill for MVP: users can just open a browser tab

**Verdict**: Viable for desktop packaging of the web app in Phase 3, but unnecessary for MVP where a browser tab suffices.

### 4. VS Code Fork (Cursor Pattern)

**Pros**:
- Maximum editor integration; native AI features in editor
- Seamless UX; AI capabilities feel like first-class IDE features
- Proven by Cursor and Windsurf

**Cons**:
- Extreme maintenance cost: must track VS Code upstream continuously
- Requires team of 5+ engineers just for fork maintenance
- Slow iteration: changes must be rebased on upstream updates
- Not viable for a small team or MVP timeline

**Verdict**: Rejected. Maintenance cost is prohibitive for the current team size and project stage.

## Consequences

### Positive

- **Fastest MVP path**: No desktop packaging, no extension review, no marketplace distribution. Users open `http://localhost:3210` in any browser.
- **Cross-platform by default**: Browser is the UI surface; works on Windows, macOS, Linux without platform-specific builds.
- **Rapid iteration**: Hot module replacement (Vite HMR) for frontend; server restart for backend. No extension reload cycle.
- **Full UI freedom**: No Webview sandbox, no Extension API constraints. Any Svelte component, any layout, any CSS.
- **Direct Node.js access**: `child_process.spawn`, `node-pty`, `chokidar` all available natively in the backend.
- **Future packaging**: The same codebase can be wrapped in Electron or Tauri for desktop distribution without architectural changes.

### Negative

- **Separate window from editor**: Users must switch between their editor and the browser tab. No in-editor integration.
- **No editor API access**: Cannot read cursor position, open files, or interact with LSP. The product is a workflow orchestrator, not an IDE.
- **Browser tab lifecycle**: Users may accidentally close the tab. Mitigation: WebSocket reconnect with event replay.
- **localhost security**: Must bind to 127.0.0.1 only; must validate Origin headers. A misconfigured binding could expose the system.

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users find browser tab inconvenient | Medium | Low | Phase 2: Electron/Tauri packaging for desktop app with system tray |
| Browser tab closed accidentally | Medium | Low | WebSocket reconnect + event replay; browser beforeunload warning |
| Localhost port conflict | Low | Medium | Configurable PORT; startup probe with clear error message |
| Users expect editor integration | Medium | Medium | Clear product positioning: "terminal companion, not terminal replacement" (C-001) |

## References

- Design Research: "Local-Server-Plus-Browser Pattern" (Open WebUI, Jupyter, Aider)
- Constraint C-003: Product MUST use local web app architecture
- SA-01: Local web app architecture decision
