# Finding: Panel Switching and State Continuity

> Role: ui-designer | Impact: MEDIUM

## Description

The right content area supports three panels (Workflow, Dialog, Terminal) switchable via tabs (UI-04). When a user switches panels, the state of the previous panel must be preserved. For example, a running workflow should continue showing progress even when the user switches to the Dialog tab. Similarly, terminal sessions must remain active when the user navigates away.

The design-research pitfall "GUI shallowness" warns against creating a wrapper that adds no value over CLI. Panel switching must feel seamless and stateful, not like navigating between disconnected pages.

Additionally, cross-panel interactions need design: when the AI Dialog (F-003) triggers a workflow, the user should see feedback in the Dialog panel AND have the option to switch to the Workflow panel for detailed progress. The ActionStatusChip in the Dialog serves as the bridge.

## Affected Features

- F-001 Workflow Commander: Must maintain progress state when panel is not active.
- F-003 AI Dialog: Must show cross-panel triggers (ActionStatusChip) and allow navigation to Workflow panel.
- F-004 Terminal Bridge: Terminal sessions must persist across panel switches.
- F-005 State Sync Engine: Must deliver events to all panels regardless of which is active.

## Recommendation

1. Implement panel content as persistent Svelte components (not destroyed on tab switch).
2. Use the Svelte store pattern from F-005 to ensure all panels receive state updates even when hidden.
3. Design the ActionStatusChip in F-003 as a clickable element that switches to the Workflow tab and scrolls to the relevant step.
4. Add a notification badge on the Workflow tab when a step completes while the user is on another panel.
