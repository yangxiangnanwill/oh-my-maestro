# F-007 — Approval Gate

> Role: product-manager | Related decisions: PM-01, PM-04

## Architecture

Approval Gate implements the trust layer for automated workflow execution. When a workflow step involves potentially destructive actions (file modifications, command execution, deployment), the system MUST pause and present the proposed action for user review.

This feature directly addresses the "approval bypass" pitfall from design research: if the GUI auto-approves all CLI actions without showing diffs or plans, it removes the safety net. The Cline and Claude Code pattern of "agent-in-sidebar with approval gate" is the reference implementation.

From the product perspective, Approval Gate is a "should" priority feature (not "must") for MVP, but it is critical for user trust. The product decision is that Approval Gate MUST be available for workflows that modify files or execute commands, but the granularity of approval (per-step vs. per-workflow) SHOULD be configurable.

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Approval Request | Consumes | Event from workflow engine — `{ stepId, action, diff?, dryRunResult?, riskLevel }` |
| User Decision | Emits | Approve / Reject / Modify — forwarded to workflow engine to continue or abort |
| Diff Preview | Consumes | `GET /api/approvals/{id}/diff` — file change diff for user review |
| Dry-Run Result | Consumes | `GET /api/approvals/{id}/dry-run` — simulated execution output |

## Constraints (RFC 2119)

- Approval Gate MUST pause workflow execution at steps that modify files or execute commands, pending user confirmation (UI-07).
- The system MUST present a diff preview for file modification steps (UI-07).
- The system SHOULD present dry-run results when available (UI-07, PM-04).
- Users MUST be able to approve, reject, or request modification of a proposed action.
- Approval Gate MUST NOT auto-approve destructive actions without explicit user consent.
- The granularity of approval (per-step vs. per-workflow batch) SHOULD be configurable by the user.

## Test Approach

- **Unit**: Risk classification — verify that file-modifying steps are correctly flagged for approval.
- **Integration**: Workflow pause/resume — trigger a workflow with an approval step, verify execution pauses, user approves, and execution resumes.
- **E2E**: User triggers a workflow, encounters an approval gate, reviews the diff, approves, and sees the workflow complete.
- **Edge case**: User rejects an approval — verify the workflow aborts gracefully with a clear status message.

## TODOs

- Define the risk classification taxonomy — which actions require approval vs. which are auto-approved.
- Specify the batch approval interaction — can users approve all remaining steps in a workflow at once?
- Determine how Approval Gate interacts with AI Dialog — if a user triggers a workflow via natural language, how is the approval presented?
- Design the diff preview component — inline diff vs. side-by-side view.
