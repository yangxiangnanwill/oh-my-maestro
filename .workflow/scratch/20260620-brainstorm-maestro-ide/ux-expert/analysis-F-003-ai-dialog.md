# F-003 — AI Dialog

> Role: ux-expert | Related decisions: UX-01, UX-05, UI-05, SA-02

## Architecture

The AI Dialog panel is the natural language interaction surface for Claude Code. It implements UX-05 (natural language intent routing) and UX-01 (concept hiding). The panel architecture has three layers:

1. **Conversation Surface** — Chat-style interface with message bubbles. User messages accept free-form natural language. Assistant messages MUST support streaming output and Markdown rendering per UI-05, including syntax-highlighted code blocks. The Agent-Sidebar Pattern from design research (Cline, Continue) applies directly.
2. **Intent Router Integration** — User messages are analyzed for actionable intents. When an intent matches a workflow trigger, the Dialog MUST surface an inline action card (e.g., "Start workflow: Plan a new feature") that the user can confirm or dismiss. This prevents the chat from becoming a command-line in disguise.
3. **Context Panel** — A collapsible sidebar within the dialog showing conversation-relevant context: current project state, active workflow, and recent actions. This implements status-oriented interaction (UX-02) within the dialog context.

The dialog MUST NOT require users to use slash commands or memorize syntax. However, it SHOULD support slash commands as a power-user shortcut for users who opt into advanced mode (UX-04), mirroring the Command Palette / Slash Command Pattern from Continue.dev research.

## Interface Contract

- **DialogInput**: Accepts `{ message: string, context: { projectId, activeWorkflowId } }`. Returns streaming response via Server-Sent Events or WebSocket.
- **IntentDetected**: Emits `{ intent: string, confidence: number, suggestedAction: { type, workflowId, params } }`. Consumed by Workflow Commander (F-001) if user confirms the suggested action.
- **ConversationState**: `{ messages: Array<{ role, content, timestamp, actions }>, context: ProjectContext }`. Persists across panel switches per UI-04.

## Constraints (RFC 2119)

- The AI Dialog MUST present streaming output with a visible typing indicator within 200ms of receiving the first token from the backend.
- Natural language inputs that match a workflow intent with confidence above 70% SHOULD surface an inline action card for user confirmation before auto-routing.

> **Cross-Role Resolution (C-003)**: 70% confidence threshold downgraded to SHOULD for MVP pending classification strategy validation; fallback is disambiguation list
- The dialog MUST NOT auto-execute workflows without explicit user confirmation, even when intent confidence is high.
- Markdown rendering MUST support code syntax highlighting for at least JavaScript, TypeScript, Python, and YAML.
- Conversation history MUST persist across panel switches within the same session; it SHOULD persist across browser sessions via local storage.
- The dialog MUST display a "thinking" state when the AI is processing but has not yet emitted output, preventing the appearance of a frozen interface.

## Test Approach

- **Unit**: Intent detection accuracy against a labeled test set; Markdown rendering correctness for edge cases (nested code blocks, tables, malformed syntax).
- **Integration**: End-to-end conversation flow — user sends message, intent is detected, action card appears, user confirms, workflow triggers via State Sync Engine.
- **Usability**: Task-based test — users describe a feature request in natural language and successfully trigger the correct workflow. Measure intent-to-action completion rate.
- **Streaming**: Verify streaming output renders progressively without layout shift or flicker; measure first-token-to-render latency.

## TODOs

- Define the action card UI pattern for confirmed vs. dismissed intents.
- Specify conversation persistence scope (session-only vs. cross-session vs. project-scoped).
- Design the "thinking" state animation and timeout behavior (what to show if the AI takes more than 10 seconds).
- Determine the interaction between AI Dialog and Terminal Bridge — when does the dialog redirect output to the terminal panel.
