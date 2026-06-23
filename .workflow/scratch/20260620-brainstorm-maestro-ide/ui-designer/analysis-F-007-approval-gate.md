# F-007 — Approval Gate

> Role: ui-designer | Related decisions: UI-07, PM-01, UX-01

## Architecture

<!-- superseded: The Approval Gate is a modal overlay that appears when a workflow reaches a node requiring user confirmation. -->
> **Cross-Role Resolution (C-001)**: Rename ApprovalModal to ApprovalInline — inline panel, not modal overlay, per UX non-blocking requirement. The Approval Gate is an inline panel that appears within the active panel when a workflow reaches a node requiring user confirmation. It follows the Approval Gate Pattern from design-research (Cline, Claude Code). The inline panel presents a diff preview and dry-run results before the user decides.

```
+-------------------------------------------+
|  [Workflow] [Dialog] [Terminal]            |
|  +-- Approval Required -----------------+ |
|  | Step: Apply Code Changes             | |
|  |                                       | |
|  | +-- Diff Preview ------------------+ | |
|  | | - const old = 'value';           | | |
|  | | + const new = 'updated';         | | |
|  | +-----------------------------------+ | |
|  |                                       | |
|  | +-- Dry Run Result ----------------+ | |
|  | | Files affected: 3                | | |
|  | | Lines added: 12                  | | |
|  | | Lines removed: 4                 | | |
|  | +-----------------------------------+ | |
|  |                                       | |
|  | [Reject]              [Approve]       | |
|  +---------------------------------------+ |
+-------------------------------------------+
```

The modal blocks the workflow execution until the user approves or rejects. The workflow progress bar in F-001 shows a "WAITING FOR APPROVAL" state at the current step.

## Interface Contract

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| ApprovalModal | `{ step: Step, diff: DiffData, dryRun: DryRunResult, onApprove: () => void, onReject: () => void }` | WorkflowCommander |
| DiffPreview | `{ hunks: DiffHunk[], filePaths: string[] }` | ApprovalModal |
| DryRunSummary | `{ filesAffected: number, linesAdded: number, linesRemoved: number, warnings: string[] }` | ApprovalModal |

The DiffPreview component MUST render unified diff format with syntax highlighting. The DryRunSummary provides a compact statistical overview.

## Constraints (RFC 2119)

- The approval modal MUST display a diff preview before any file-modifying action, per UI-07.
- The modal MUST present both "Approve" and "Reject" actions with equal visual weight; "Approve" MUST NOT be the default focus target.
- The diff preview MUST support syntax highlighting for common file types.
- The dry-run summary SHOULD display when available, per UI-07.
- The workflow progress bar MUST show a distinct "WAITING FOR APPROVAL" state when the gate is active.
- The modal MUST NOT auto-dismiss; explicit user action is required.
- The Reject action MUST halt the workflow at the current step; it SHOULD offer a "Skip and Continue" option for non-critical steps.
- The diff preview MUST handle large diffs gracefully (collapsible hunks, virtualized rendering).

## Test Approach

- Unit: DiffPreview renders unified diff correctly; DryRunSummary displays accurate counts.
- Integration: Workflow execution pauses at approval node; modal appears; approve resumes workflow; reject halts it.
- Edge case: Very large diff (1000+ lines); binary file diff; empty diff; dry-run with warnings.
- Accessibility: Modal traps focus; Escape key triggers Reject; diff is navigable via keyboard.

## TODOs

- Select the diff rendering library (e.g., diff2html, Monaco diff editor).
- Design the "Skip and Continue" interaction for non-critical rejection.
- Specify the large-diff virtualization strategy.
- Coordinate with SA on the dry-run data format and availability guarantees.
