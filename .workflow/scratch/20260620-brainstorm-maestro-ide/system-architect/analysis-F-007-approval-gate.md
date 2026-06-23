# F-007 — Approval Gate

> Role: system-architect | Related decisions: SA-02, SA-06, SA-07

## Architecture

Approval Gate intercepts workflow execution at designated checkpoints and presents a decision interface to the user. This implements the approval pattern observed in Cline and Claude Code (see design research: "Agent-Sidebar Pattern").

1. **Gate Detector**: Monitors workflow step execution events. When a step is marked as requiring approval (via workflow metadata or `--dry-run` flag), the detector pauses the child process and emits a `gate:pending` event.

2. **Diff Renderer Service**: When a gate involves file changes, this service extracts the diff from CLI output (via the adapter layer) and transforms it into a structured `DiffView` object. Supports unified diff format.

3. **Approval State Machine**: Manages the lifecycle of each approval gate: `pending -> approved | rejected | expired`. Approved gates resume the child process; rejected gates send `SIGINT` and mark the workflow as cancelled; expired gates (timeout after 10 minutes) default to rejected.

Module layout:
```
server/
  services/
    gate-detector.service.ts      # monitors execution events
    diff-renderer.service.ts      # CLI diff extraction
    approval-state.service.ts     # gate lifecycle state machine
  models/
    approval-gate.ts              # Gate state model
client/
  components/
    approval/
      ApprovalPanel.svelte        # approve/reject UI
      DiffPreview.svelte          # unified diff renderer
      DryRunSummary.svelte        # dry-run result display
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `WS event: gate:pending` | Backend -> Frontend | `{ gateId, executionId, stepIndex, diff?: DiffView, dryRunResult?: string }` |
| `POST /api/gates/:id/approve` | Frontend -> Backend | `{}` returns `{ resumed: boolean }` |
| `POST /api/gates/:id/reject` | Frontend -> Backend | `{ reason?: string }` returns `{ cancelled: boolean }` |
| `GET /api/gates/:id/diff` | Backend -> Frontend | `{ diff: DiffView }` where `DiffView = { files: FileDiff[] }` |

Consumers: Workflow Commander (F-001) receives resume/cancel signals; State Sync Engine (F-005) publishes gate state changes.

## Constraints (RFC 2119)

- Every workflow step marked as `requiresApproval: true` in its metadata MUST trigger a gate; the system MUST NOT auto-approve such steps.
- The gate detector MUST pause the CLI child process (via PTY flow control or SIGTSTP) while awaiting user decision.
- Gate expiry MUST default to 10 minutes; the system MUST reject the gate on expiry and terminate the associated workflow.
- The diff renderer MUST handle binary file diffs gracefully (show "binary file changed" placeholder).
- Approval decisions MUST be logged with timestamp and user identity for audit purposes.
- The system SHOULD support `--dry-run` as a pre-approval preview; dry-run output MUST be displayed before the actual approval prompt.

## Test Approach

- **Unit**: Approval state machine transitions: pending -> approved/rejected/expired.
- **Integration**: Workflow execution hits approval step -> gate:pending event -> user approves -> process resumes.
- **Edge**: Gate timeout while user is disconnected; verify automatic rejection and cleanup.
- **Diff**: Various diff formats (unified, git diff) parsed through the diff renderer.

## TODOs

- Determine how workflow metadata specifies which steps require approval (annotation in `ralph skills --json` output?).
- Investigate whether PTY flow control (SIGTSTP/SIGCONT) is reliable on Windows conpty.
- Define the diff extraction strategy: parse from CLI stdout or invoke a separate `git diff` command.
