# F-003 — AI Dialog

> Role: ui-designer | Related decisions: UI-04, UI-05, UX-05, SA-02

## Architecture

The AI Dialog panel occupies the right content area when the "Dialog" tab is active. It follows the Agent-Sidebar pattern from design-research (Cline, Continue.dev) adapted to a full panel layout.

```
+-------------------------------------------+
| [Workflow] [Dialog] [Terminal]   <- tabs  |
+-------------------------------------------+
| +-- Conversation --+                      |
| | User: Help me fix |                     |
| | the auth bug      |                     |
| |                   |                     |
| | AI: I'll analyze  |                     |
| | the auth module.  |                     |
| | > Running analyze |  <- inline status   |
| | > Found 3 issues  |                     |
| | ```typescript     |  <- Markdown render |
| | // fix suggestion |                     |
| | ```               |                     |
| +-------------------+                     |
+-------------------------------------------+
| +-- Input --+  [Send]                     |
| | Type your request...|                   |
| +---------------------+                   |
+-------------------------------------------+
```

The conversation view renders AI responses as Markdown with syntax-highlighted code blocks (UI-05). Inline status chips show when the AI triggers a workflow or CLI command behind the scenes.

## Interface Contract

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| ConversationView | `{ messages: Message[], isStreaming: boolean }` | AIDialog |
| MessageBubble | `{ role: 'user' | 'assistant', content: string, status?: ActionStatus }` | ConversationView |
| ChatInput | `{ onSubmit: (text: string) => void, disabled: boolean }` | AIDialog |
| ActionStatusChip | `{ action: string, state: 'running' | 'done' | 'failed' }` | MessageBubble |

The ChatInput onSubmit callback MUST pass the raw user text to the backend for intent recognition (UX-05). The backend returns a routed action; the UI displays the result inline.

## Constraints (RFC 2119)

- AI responses MUST render as Markdown with syntax-highlighted code blocks, per UI-05.
- Streaming output MUST display token-by-token as it arrives via WebSocket, per UI-05.
- The input field MUST accept natural language; the system MUST NOT require slash commands or structured syntax, per UX-05.
- When the AI triggers a workflow, the conversation MUST show an inline ActionStatusChip indicating the triggered action and its state.
- The conversation view MUST auto-scroll to the latest message during streaming.
- The input field MUST be disabled while the AI is streaming a response.
- The dialog SHOULD provide a "Stop" button to interrupt a running AI response.
- Past conversations SHOULD be persisted and restorable per project.

## Test Approach

- Unit: MessageBubble renders Markdown correctly; ActionStatusChip transitions through states.
- Integration: Submitting text triggers backend intent recognition; streaming response renders incrementally; workflow trigger shows inline status.
- Edge case: Very long code blocks (scroll within message); empty response; error response from backend.
- Accessibility: Screen reader announces new messages; input field has proper label; streaming updates use ARIA live region with polite politeness.

## TODOs

- Specify the Markdown renderer library and syntax highlighting theme for dark mode.
- Design the conversation history sidebar or selector for multi-conversation support.
- Define the ActionStatusChip interaction model (clickable to navigate to F-001 progress view).
- Coordinate with SA on the streaming protocol for Claude Code CLI subprocess output.
