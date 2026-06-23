# F-003 — AI Dialog

> Role: system-architect | Related decisions: SA-02, SA-03

## Architecture

AI Dialog is the conversational interface to Claude Code. It routes natural language input to the appropriate maestro command or directly to Claude Code CLI.

1. **Dialog Session Manager**: Maintains per-user conversation state. Each session corresponds to one Claude Code CLI child process. Sessions are created on demand and cleaned up after a configurable idle timeout.

2. **Intent Router**: Receives the user message, classifies intent (workflow trigger, status query, freeform coding question), and dispatches to the appropriate handler:
   - Workflow intent -> Workflow Commander (F-001) execution pipeline
   - Status query -> Project Radar (F-002) state retrieval
   - Freeform -> Claude Code CLI stdin passthrough

3. **Streaming Output Bridge**: Pipes Claude Code CLI stdout through the CLI adapter to extract structured events, then forwards Markdown-formatted content to the frontend via WebSocket. Streaming is chunked at the sentence or code-block boundary for readability.

Module layout:
```
server/
  services/
    dialog-session.service.ts     # session lifecycle
    intent-router.service.ts      # message classification + dispatch
    streaming-bridge.service.ts   # CLI stdout -> WebSocket bridge
client/
  routes/
    dialog/
      +page.svelte                # chat interface
      message-stream.svelte       # streaming markdown renderer
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `POST /api/dialog/sessions` | Frontend -> Backend | `{}` returns `{ sessionId }` |
| `POST /api/dialog/sessions/:id/messages` | Frontend -> Backend | `{ content: string }` returns `{ messageId }` |
| `WS event: dialog:stream-chunk` | Backend -> Frontend | `{ sessionId, messageId, chunk, done: boolean }` |
| `WS event: dialog:intent-routed` | Backend -> Frontend | `{ sessionId, messageId, intent, targetFeature? }` |

Consumers: Workflow Commander (F-001) receives routed workflow intents; Terminal Bridge (F-004) displays raw CLI output from freeform sessions.

## Constraints (RFC 2119)

- Each dialog session MUST map to exactly one Claude Code CLI child process; multiple sessions MUST NOT share a process.
- Intent routing MUST complete within 100ms to avoid perceptible latency before streaming begins.
- Streaming chunks MUST be delivered to the frontend within 50ms of receiving CLI stdout.
- The session manager MUST terminate idle sessions (no messages for 10 minutes) and clean up the associated CLI process.
- The intent router SHOULD classify messages as workflow/status/freeform with at least 80% accuracy on a representative test set.
- Dialog history MUST NOT persist to disk by default; sessions are ephemeral unless the user explicitly exports.

## Test Approach

- **Unit**: Intent router classification against a labeled message dataset.
- **Integration**: End-to-end message -> intent route -> CLI spawn -> streaming output -> frontend render.
- **Load**: 10 concurrent dialog sessions with interleaved messages to verify process isolation.
- **Edge**: Malformed CLI output (ANSI escape codes, binary data) fed through streaming bridge.

## TODOs

- Define the intent classification model: rule-based keyword matching for MVP, or lightweight ML classifier.
- Determine whether Claude Code CLI supports an interactive stdin/stdout session or requires per-command invocation.
- Evaluate streaming chunk boundaries: sentence-level, token-level, or newline-delimited.
- Investigate whether conversation context (previous messages) can be passed to Claude Code CLI or must be managed client-side.
