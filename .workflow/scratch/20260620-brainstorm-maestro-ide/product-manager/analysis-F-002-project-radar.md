# F-002 — Project Radar

> Role: product-manager | Related decisions: PM-03, PM-02

## Architecture

Project Radar is the status-oriented entry point for the application. It provides a real-time, visual dashboard of project health: milestones, phases, and step-level progress. Per UX-02, the primary interaction mode is state-oriented — the dashboard shows current state and recommends the next action.

The dashboard MUST aggregate state from multiple sources: maestro project state files, active workflow execution status (from F-005), and milestone completion data. The "recommended next step" feature is a key differentiator — it reduces decision fatigue by surfacing the most logical action based on current project state.

Project Radar directly supports the core MVP value proposition of "status visualization" (PM-03). For maestro existing users, it replaces the mental model of tracking project state via CLI output. For Claude Code new users, it provides an immediate understanding of where their project stands.

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Project State | Consumes | `GET /api/projects/{id}/state` — milestone/phase/step hierarchy with status indicators |
| State Events | Consumes | WebSocket subscription from F-005 — real-time state change notifications |
| Next Step Recommendation | Emits | Computed recommendation based on current state + workflow catalog; links to F-001 for execution |
| Project List | Consumes | `GET /api/projects` — list of projects with summary status |

## Constraints (RFC 2119)

- Project Radar MUST display project state using visual progress indicators, not text-only lists (UX-06).
- The dashboard MUST present a recommended next action based on current project state (UX-02).
- State updates MUST propagate in real-time via WebSocket (SA-03).
- The dashboard MUST NOT require the user to manually refresh to see updated state.
- Project Radar SHOULD support multiple projects simultaneously, with the ability to switch focus.
- The recommended next step MUST link directly to a triggerable action in Workflow Commander (F-001).

## Test Approach

- **Unit**: Recommendation engine — given a project state, verify the correct next step is suggested.
- **Integration**: State change propagation — verify that a workflow step completion in F-005 triggers a visual update in Project Radar.
- **E2E**: User opens the app, sees current project status, clicks the recommended next step, and a workflow begins.
- **Edge case**: Stale state — user runs a maestro command in their terminal outside the GUI; verify Project Radar eventually reflects the change.

## TODOs

- Define the visual vocabulary for milestone/phase/step status (icons, colors, progress bars).
- Specify the recommendation algorithm — rule-based vs. learned.
- Determine how external CLI actions (outside the GUI) are detected and reflected.
- Design the multi-project view and project switching interaction.
