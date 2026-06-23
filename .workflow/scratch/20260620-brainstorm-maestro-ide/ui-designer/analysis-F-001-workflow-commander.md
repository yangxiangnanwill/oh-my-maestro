# F-001 — Workflow Commander

> Role: ui-designer | Related decisions: UI-01, UI-03, UI-04, UI-06, PM-04, UX-05

## Architecture

The Workflow Commander occupies the right-side main content area when the "Workflow" tab is active (see UI-04). It consists of two sub-panels: a workflow type selector at the top and an execution progress view below.

```
+-------------------------------------------+
| [Workflow] [Dialog] [Terminal]   <- tabs  |
+-------------------------------------------+
| Workflow Type Selector                    |
| +---------+ +---------+ +---------+      |
| | Analyze | |  Plan   | | Execute |      |
| +---------+ +---------+ +---------+      |
| +---------+ +---------+ +---------+      |
| |  Test   | |  Ship   | | Custom  |      |
| +---------+ +---------+ +---------+      |
+-------------------------------------------+
| Execution Progress                        |
| Step 1: Analyze    [====] DONE            |
| Step 2: Plan       [==  ] RUNNING         |
| Step 3: Execute    [    ] PENDING         |
| Step 4: Test       [    ] PENDING         |
| +-- Current Step Detail --+              |
| | Plan: Generating task   |              |
| | breakdown...             |              |
| +--------------------------+              |
+-------------------------------------------+
```

The left navigation (UI-03) provides quick-access workflow shortcuts that navigate directly to this panel with a pre-selected workflow type.

## Interface Contract

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| WorkflowTypeGrid | `{ types: WorkflowType[], onSelect: (id) => void }` | WorkflowCommander |
| StepProgressBar | `{ steps: Step[], current: number, status: StepStatus[] }` | WorkflowCommander |
| StepDetailPanel | `{ step: Step, output: StreamOutput }` | WorkflowCommander |
| WorkflowTrigger | `{ workflowId: string, params: Record<string, string> }` | LeftNav shortcuts, AI Dialog |

The WorkflowTrigger contract MUST accept optional parameters so the AI Dialog (F-003) can route natural-language intents to specific workflows with pre-filled arguments.

## Constraints (RFC 2119)

- The workflow type selector MUST present workflows grouped by scenario (not by CLI command name), per UX-01 concept hiding.
- One-click trigger MUST start the full workflow chain without requiring intermediate confirmation, per PM-04.
- The step progress bar MUST update in real-time via WebSocket events from F-005, per SA-03.
- Each step MUST display one of four statuses: PENDING, RUNNING, DONE, FAILED.
- The current step detail panel MUST show streaming output from the active CLI subprocess.
- The workflow selector MUST NOT expose raw maestro command names (chain, skill, delegate); it MUST use translated labels per UX-03.
- Advanced mode (UX-04) SHOULD reveal the underlying command mapping as a tooltip or expandable section.

## Test Approach

- Unit: WorkflowTypeGrid renders correct grouping; StepProgressBar transitions between states.
- Integration: Triggering a workflow from the grid dispatches the correct backend command; progress updates arrive via WebSocket.
- Visual regression: Snapshot the four step states (PENDING, RUNNING, DONE, FAILED) across dark theme.
- Accessibility: Keyboard navigation across the workflow grid; screen reader announces step status changes.

## TODOs

- Define the complete workflow type catalog and grouping taxonomy.
- Specify the parameter form schema for workflows requiring user input (e.g., target file, scope).
- Design the "Custom Workflow" builder interface for advanced users.
- Coordinate with UX on the intent-to-workflow routing table for F-003 integration.
