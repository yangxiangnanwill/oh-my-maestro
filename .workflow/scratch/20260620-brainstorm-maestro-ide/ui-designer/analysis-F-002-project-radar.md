# F-002 — Project Radar

> Role: ui-designer | Related decisions: UI-01, UI-03, UX-02, UX-06, SA-03

## Architecture

Project Radar has two surfaces: the left navigation status tree (UI-03) and a full dashboard view in the right content area. The status tree provides at-a-glance hierarchy; the dashboard provides detailed progress and recommendations.

```
LEFT NAV - Status Tree          |  RIGHT CONTENT - Dashboard
+-----------------------+       |  +-----------------------------------+
| v Project Alpha       |       |  | Project Alpha                     |
|   v Milestone 1       |       |  | Overall: 60% [======    ]         |
|     Stage 1  [DONE]   |       |  |                                   |
|     Stage 2  [RUN]    |       |  | Milestone 1: 75%                  |
|   > Milestone 2       |       |  | Stage 1 [DONE] Stage 2 [RUN]     |
|   > Milestone 3       |       |  |                                   |
| v Project Beta        |       |  | Recommended Next Step:            |
|   > Milestone 1       |       |  | [Run Test Suite for Stage 2]     |
+-----------------------+       |  +-----------------------------------+
```

The status tree uses the VS Code Explorer pattern (see design-research: Status Tree Pattern) with hierarchical nodes: Project > Milestone > Stage > Step. Each node carries a status badge (icon + color).

## Interface Contract

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| ProjectStatusTree | `{ projects: ProjectNode[], onSelect: (node) => void }` | LeftNav |
| ProgressGauge | `{ percentage: number, status: 'on-track' | 'at-risk' | 'blocked' }` | Dashboard |
| RecommendedAction | `{ action: Action, confidence: number, onAccept: () => void }` | Dashboard |
| StatusBadge | `{ status: StepStatus, label: string }` | Tree nodes, progress bars |

The ProjectStatusTree data MUST be sourced from F-005 State Sync Engine via WebSocket subscription, not REST polling.

## Constraints (RFC 2119)

- The status tree MUST update in real-time; stale data MUST NOT persist beyond 2 seconds after a state change event.
- Each tree node MUST display a visual status indicator (icon or color badge), per UX-06.
- The dashboard MUST show a "Recommended Next Step" card derived from the current project state, per UX-02.
- The recommended action card MUST be clickable and trigger the corresponding workflow in F-001.
- The status tree MUST support collapse/expand per project and per milestone.
- The dashboard MUST NOT display raw maestro terminology; all labels MUST pass through F-006 Concept Translator.
- The progress gauge SHOULD use three visual states: on-track (green), at-risk (amber), blocked (red).

## Test Approach

- Unit: StatusBadge renders correct icon per status; ProgressGauge calculates percentage correctly.
- Integration: WebSocket event updates the tree node status within 2 seconds; clicking recommended action navigates to F-001 with correct workflow pre-selected.
- Edge case: Empty project list (first-time user); single project with no milestones; milestone with all stages complete.
- Accessibility: Tree navigation via keyboard (arrow keys); ARIA live region for status changes.

## TODOs

- Define the status icon and color mapping for all StepStatus values.
- Specify the recommendation algorithm input schema (what data drives the "next step" suggestion).
- Design the empty state for first-time users with no projects.
- Coordinate with SA on the WebSocket event schema for state changes.
