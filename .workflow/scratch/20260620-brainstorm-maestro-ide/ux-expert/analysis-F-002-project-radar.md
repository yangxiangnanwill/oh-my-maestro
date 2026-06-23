# F-002 — Project Radar

> Role: ux-expert | Related decisions: UX-02, UX-06, SA-03, PM-03

## Architecture

Project Radar is the status-oriented dashboard that fulfills UX-02 (state-oriented interaction). It MUST display real-time project status using visual progress indicators per UX-06, not text-based lists. The dashboard architecture consists of:

1. **Milestone Progress View** — Visual representation of project milestones as a horizontal roadmap or circular progress rings. Each milestone MUST show its completion percentage and current stage (see guidance §2: "phase" maps to "Stage").
2. **Active Step Indicator** — Highlights the currently executing step with animated progress. The indicator MUST recommend the next action based on project state, implementing the "status + recommended next step" pattern from UX-02.
3. **History Timeline** — Collapsible log of completed steps with status badges (success/failure/skipped). Advanced mode MUST show raw command names per UX-04.

Data flows from the State Sync Engine (F-005) via WebSocket events. The Radar MUST subscribe to state change events and update within 500ms of receiving a push notification, as real-time feedback is the core value proposition per PM-03.

The Status Tree Pattern from design research (VS Code Explorer/Git/Test panels) directly applies: hierarchical tree nodes (project > milestones > stages > steps) with status icons and badges.

## Interface Contract

- **ProjectStatus**: `{ milestones: Array<{ id, name, stages: Array<{ id, name, status, steps: Array<{ id, name, status }> }> }>, recommendedNext: { actionId, label, rationale } }`. Consumed by the left navigation panel (UI-03) for compact status display.
- **StateSubscription**: Subscribes to WebSocket channel `project:{id}:state`. Emits incremental diffs, not full snapshots, to minimize rendering overhead.

## Constraints (RFC 2119)

- Project status MUST update within 500ms of a WebSocket state-change event.
- The dashboard MUST display a "Recommended Next Step" card at all times when a project is active; it MUST NOT show an empty or static state without guidance.
- Visual progress indicators MUST use color, shape, and icon to convey status without relying solely on color (accessibility per WCAG 2.1 AA).
- Milestone progress MUST use percentage-based completion derived from step status, not arbitrary estimates.
- The Radar MUST gracefully handle WebSocket disconnection by showing a "syncing" indicator and buffering the last known state.
- Simple mode MUST NOT display internal session IDs or delegate execution IDs.

## Test Approach

- **Unit**: Visual progress calculation logic — verify percentage derivation from step statuses across edge cases (empty project, all-failed, partial completion).
- **Integration**: WebSocket subscription — verify dashboard updates within 500ms when the State Sync Engine pushes state changes.
- **Usability**: Time-to-comprehension test — users view the dashboard and correctly identify project status and recommended next action within 5 seconds.
- **Accessibility**: Automated WCAG 2.1 AA audit on progress indicators and status badges; screen reader navigation test.

## TODOs

- Define the visual vocabulary for step statuses (icons, colors, animations) in collaboration with the UI Designer.
- Specify the "recommended next step" algorithm — rule-based vs. AI-suggested.
- Design the disconnection/reconnection state transition and user notification pattern.
- Determine the information density trade-off for the compact left-nav status display vs. the full Radar view.
