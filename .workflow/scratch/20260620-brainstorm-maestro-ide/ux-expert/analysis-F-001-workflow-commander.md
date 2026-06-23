# F-001 — Workflow Commander

> Role: ux-expert | Related decisions: UX-01, UX-02, UX-04, UX-05, PM-04, PM-06

## Architecture

The Workflow Commander panel serves as the primary orchestration surface. It MUST present workflow types as intent-based categories (e.g., "Plan a new feature", "Fix a bug", "Review code") rather than exposing maestro chain/skill/delegate terminology per UX-01. The panel architecture comprises three interaction layers:

1. **Intent Entry Layer** — Natural language input or categorized quick-select tiles that map user intent to workflow type. The intent entry MUST route to the correct workflow via the Concept Translator (F-006).
2. **Configuration Layer** — Context-sensitive parameter form that appears only after intent selection. Fields MUST use user-friendly labels (see guidance §2 terminology mapping) and hide advanced options behind a disclosure toggle per UX-04.
3. **Execution Layer** — Step-by-step progress visualization showing the running workflow as a horizontal stepper or vertical timeline. Each step MUST display its translated name and current status.

The panel MUST support both one-click full-chain execution (PM-04) and single-step execution for advanced users who opt into expert mode.

## Interface Contract

- **IntentRouter**: Accepts natural language string, returns `{ workflowId: string, confidence: number, params: Record<string,unknown> }`. Consumed by the State Sync Engine (F-005) to initiate workflow.
- **WorkflowProgress**: Emits `{ stepIndex, stepName, status: 'pending'|'running'|'complete'|'failed' }`. Consumed by Project Radar (F-002) for cross-panel status display.
- **ApprovalRequest**: Emits `{ stepName, diffPreview, dryRunResult }` when a workflow step hits an approval gate (F-007). The Commander MUST pause execution and surface the approval UI inline.

## Constraints (RFC 2119)

- The workflow selection interface MUST NOT display raw maestro command names (e.g., `maestro delegate`, `maestro brainstorm`) to users in simple mode.
- One-click workflow execution MUST trigger the complete chain from start to finish without requiring intermediate user input, unless an approval gate intervenes.
- The system SHOULD preserve the last-used workflow as a prominent "Run again" action on subsequent visits.
- Advanced mode MUST expose the raw skill/chain mapping for users who opt in via UX-04.
- Intent recognition confidence below 70% MUST trigger a clarification prompt rather than auto-routing.
- Workflow cancellation MUST be available at every step with a visible "Stop" control.

## Test Approach

- **Unit**: IntentRouter mapping accuracy against a test corpus of 50+ natural language inputs; verify correct workflow selection and parameter extraction.
- **Integration**: End-to-end workflow trigger from intent entry through step completion, verifying State Sync Engine events fire in correct order.
- **Usability**: Task-based testing — users complete "plan and execute a feature" using only the Workflow Commander panel. Measure time-on-task and error rate.
- **A/B**: Compare intent-entry (natural language) vs. category-select (visual tiles) for workflow discovery and completion rates.

## TODOs

- Define the complete intent-to-workflow mapping table with the Concept Translator (F-006) team.
- Validate intent recognition confidence thresholds through user testing.
- Design the "Run again" workflow history pattern and persistence strategy.
- Specify the transition behavior when a workflow step triggers an approval gate mid-execution.
