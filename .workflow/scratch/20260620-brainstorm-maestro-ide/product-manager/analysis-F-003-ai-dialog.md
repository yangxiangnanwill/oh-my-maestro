# F-003 — AI Dialog

> Role: product-manager | Related decisions: PM-02, PM-04

## Architecture

AI Dialog is the natural language entry point for users who cannot or prefer not to navigate the workflow catalog directly. Per UX-05, users MUST be able to describe their intent in natural language, and the system routes to the corresponding workflow.

> **Cross-Role Resolution (C-003)**: Intent classification strategy MUST support at least 70% confidence target; rule-based MVP needs disambiguation fallback

This feature serves two user segments differently:
- **Claude Code new users**: AI Dialog is their primary interaction surface — they describe what they want, and the system handles the rest.
- **maestro existing users**: AI Dialog is an accelerator — they can still use Workflow Commander directly, but natural language provides a faster path for known intents.

The dialog MUST support streaming output (UI-05) since Claude Code responses include code and formatted content. Intent recognition routes user input to either a workflow trigger (F-001) or a direct Claude Code conversation, depending on the detected intent.

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Chat Input | Emits | User natural language message; system detects intent and routes |
| Streaming Response | Consumes | SSE/WebSocket stream from Claude Code subprocess; includes markdown, code blocks |
| Intent Route | Emits | Classified intent → workflow trigger (F-001) or direct AI response |
| Conversation History | Consumes | `GET /api/conversations/{id}` — prior messages for context continuity |

## Constraints (RFC 2119)

- AI Dialog MUST support natural language input with automatic intent routing to workflows (UX-05).
- The dialog MUST render streaming output with Markdown support, including code blocks (UI-05).
- The system SHOULD distinguish between "workflow intent" (route to F-001) and "conversation intent" (direct AI response).
- AI Dialog MUST NOT be the only way to trigger workflows — Workflow Commander MUST remain accessible as a direct interface (PM-04).
- The conversation context MUST persist across sessions for continuity.

## Test Approach

- **Unit**: Intent classification — verify that common user phrases map to the correct workflow or conversation mode.
- **Integration**: End-to-end natural language trigger — user types "I want to add a login feature", system routes to the appropriate workflow.
- **E2E**: User conducts a multi-turn conversation, switches between AI dialog and workflow execution, and returns to the conversation with context preserved.
- **Edge case**: Ambiguous intent — system cannot determine whether the user wants a workflow or a conversation; verify graceful fallback.

## TODOs

- Define the intent classification approach — rule-based keyword matching vs. LLM-based classification.
- Specify the handoff protocol between AI Dialog and Workflow Commander when a workflow is triggered from natural language.
- Determine conversation persistence scope — per-project, per-session, or global.
- Design the visual transition when a conversation triggers a workflow execution.
