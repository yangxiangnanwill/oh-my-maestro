# F-001 — Workflow Commander

> Role: product-manager | Related decisions: PM-03, PM-04, PM-06

## Architecture

Workflow Commander is the primary value-delivery surface for MVP. It encapsulates maestro's 60+ command surface into scenario-based workflow groups, each representing a complete chain (analysis -> planning -> execution -> testing) that users trigger with a single action.

The module MUST present workflows organized by development scenario (e.g., "Start a new feature", "Debug an issue", "Review and ship") rather than by maestro command taxonomy. Each scenario group maps to one or more maestro chains internally, but the user never sees the raw command names.

Workflow Commander depends on SA-07 for structured command data (`maestro ralph skills --json --quiet`) to populate the workflow catalog. It also depends on F-005 (State Sync Engine) to reflect real-time execution status back to the user.

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Workflow Catalog | Consumes | `GET /api/workflows` — returns grouped list of available workflows with metadata (name, description, estimated steps, required context) |
| Workflow Trigger | Emits | `POST /api/workflows/{id}/execute` — initiates a workflow chain; accepts optional parameters (target scope, dry-run flag) |
| Execution Status | Consumes | WebSocket event stream from F-005 — step progress, completion, error states |
| Approval Request | Emits | Delegates to F-007 (Approval Gate) when a workflow step requires user confirmation |

## Constraints (RFC 2119)

- The product MUST present workflows grouped by scenario, not by maestro command taxonomy (PM-06, PM-03).
- Users MUST be able to trigger a complete workflow chain with a single action (PM-04).
- The system SHOULD retain the ability for advanced users to execute individual steps within a workflow (PM-04, UX-04).
- Workflow Commander MUST NOT expose raw maestro command names as primary labels (UX-01, UX-03).
- The workflow catalog MUST be dynamically populated from maestro's structured output, not hardcoded (SA-07).
- Workflow execution state MUST update in real-time via WebSocket events (SA-03, UX-02).

## Test Approach

- **Unit**: Workflow grouping logic — verify that maestro command catalog is correctly mapped to scenario groups.
- **Integration**: End-to-end workflow trigger — verify that a single UI action spawns the correct maestro chain subprocess and streams status back.
- **E2E**: User triggers "Start a new feature" workflow, observes step-by-step progress, and sees completion state.
- **Edge case**: Workflow interrupted mid-chain — verify that partial state is visible and resumable.

## TODOs

- Define the initial set of scenario groups and their mapping to maestro chains.
- Determine parameterization model — which workflows accept user input and how it is collected.
- Specify the "advanced mode" interaction for step-by-step execution (see UX-04).
- Validate that `maestro ralph skills --json --quiet` provides sufficient metadata for workflow catalog generation.
