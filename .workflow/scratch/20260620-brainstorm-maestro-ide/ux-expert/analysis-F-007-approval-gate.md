# F-007 — Approval Gate

> Role: ux-expert | Related decisions: UX-01, UX-02, UI-07, PM-01

## Architecture

The Approval Gate implements the critical trust mechanism for autonomous AI workflows. It corresponds to the Approval Gate Pattern identified in design research (Cline, Claude Code). The architecture has three interaction stages:

1. **Gate Trigger** — When a workflow step requires approval, the system MUST pause execution and present an approval UI. The trigger MUST surface inline within the active panel (Workflow Commander or AI Dialog), not as a modal dialog that disrupts context. Per UX-02, the gate MUST display what is about to happen and why approval is needed.

> **Cross-Role Resolution (C-001)**: Approval Gate is inline panel, not modal — UI interface contract updated to match (ApprovalModal → ApprovalInline)

2. **Review Surface** — The gate MUST present three review tabs:
   - **Summary** — Plain-language description of the proposed action (translated via F-006 Concept Translator). This is the default view in simple mode.
   - **Diff Preview** — Code/file changes displayed as a unified diff view. This view MUST be available in both simple and advanced modes per UI-07.
   - **Dry-Run Result** — Output from a `--dry-run` execution, showing what would happen without actual changes. This SHOULD be available when the underlying command supports dry-run.

3. **Decision Controls** — Three actions: Approve, Reject, and Modify. The "Modify" action SHOULD allow users to adjust parameters before re-submitting, reducing the reject-restart cycle.

## Interface Contract

- **ApprovalRequest**: `{ gateId, stepName, summary: TranslatedString, diffPreview: string, dryRunResult: string | null, riskLevel: 'low'|'medium'|'high' }`. Emitted by the State Sync Engine (F-005) when a workflow hits an approval step.
- **ApprovalResponse**: `{ gateId, decision: 'approved'|'rejected'|'modified', modifiedParams?: Record<string,unknown> }`. Consumed by the State Sync Engine to resume or cancel the workflow.

## Constraints (RFC 2119)

- The Approval Gate MUST pause workflow execution and wait for user input; it MUST NOT auto-approve any step that has been configured as an approval gate.
- The summary view MUST use Concept Translator (F-006) output; it MUST NOT display raw maestro command syntax in simple mode.
- Diff preview MUST render with syntax highlighting appropriate to the file type.
- High-risk operations (file deletion, overwriting existing artifacts) MUST display a risk-level badge and require an explicit confirmation checkbox in addition to the Approve button.
- The "Reject" action MUST provide a required reason field so the system can route the rejection context back to the AI for iteration.
- The gate UI MUST remain accessible and non-blocking to other panels — users SHOULD be able to review other project state while an approval is pending.

## Test Approach

- **Unit**: Verify gate trigger correctly pauses workflow execution; verify all three review tabs render their respective content.
- **Integration**: End-to-end approval flow — workflow runs, hits gate, user reviews diff, approves, workflow resumes.
- **Usability**: Measure time-to-decision for approval tasks in simple mode vs. advanced mode; verify that the summary view provides sufficient information for confident approval.
- **Accessibility**: Verify diff preview is screen-reader navigable; verify keyboard navigation covers all three decision controls.

## TODOs

- Define the risk-level classification criteria for approval steps (what makes an operation "high risk").
- Design the "Modify" parameter adjustment UI — inline editing vs. redirect to a form.
- Specify the rejection reason flow — how does the rejection context feed back into the AI iteration loop.
- Determine the timeout behavior for pending approvals (should the system notify, auto-reject, or wait indefinitely).
