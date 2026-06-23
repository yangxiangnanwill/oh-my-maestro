# F-002 — Project Radar

> Role: system-architect | Related decisions: SA-03, SA-07

## Architecture

Project Radar provides real-time project status visualization. It aggregates state from multiple sources and pushes updates via the State Sync Engine (F-005).

1. **State Aggregation Service**: Queries maestro project files (milestone/phase/step metadata) and transforms them into a structured project tree. This service subscribes to file-system change events and re-parses on mutation.

2. **WebSocket Push Layer**: When the aggregation service detects a state change, it publishes a `project:state-update` event through the shared WebSocket channel. The frontend subscribes and re-renders the radar view.

3. **Next-Step Recommendation Engine**: Lightweight rule-based module that evaluates current project state against the workflow graph to recommend the next logical action. Outputs a `Recommendation` object consumed by the frontend.

Module layout:
```
server/
  services/
    project-state.service.ts      # aggregates milestone/phase/step tree
    recommendation.service.ts     # next-step logic
  watchers/
    project-watcher.ts            # fs.watch on project metadata files
client/
  routes/
    radar/
      +page.svelte                # project status dashboard
      status-tree.svelte          # hierarchical tree component
      recommendation-card.svelte  # next-step suggestion
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `GET /api/projects/:id/state` | Backend -> Frontend | `ProjectState = { milestones: Milestone[] }` where `Milestone = { id, name, phases: Phase[] }` |
| `WS event: project:state-update` | Backend -> Frontend | `{ projectId, changedPaths: string[], snapshot: ProjectState }` |
| `GET /api/projects/:id/recommendations` | Backend -> Frontend | `{ recommendations: Recommendation[] }` where `Recommendation = { action, workflowId, reason }` |

Consumers: Workflow Commander (F-001) reads recommendations; AI Dialog (F-003) may reference current state for context.

## Constraints (RFC 2119)

- Project state queries MUST complete within 500ms for projects with up to 100 milestones.
- The state aggregation service MUST subscribe to file-system change events rather than polling on a timer (per SA-03 event-driven mandate).
- Recommendations MUST NOT include actions that require already-completed steps as prerequisites.
- The frontend MUST render state updates within 300ms of receiving a WebSocket push.
- The state snapshot sent via WebSocket MUST be a complete replacement, not a delta patch, to avoid client-side merge conflicts.

## Test Approach

- **Unit**: Recommendation engine with predefined project state fixtures; verify correct next-step selection.
- **Integration**: File-system watcher triggers -> state aggregation -> WebSocket push -> frontend render, measured end-to-end latency.
- **Stress**: 50+ concurrent state mutations to verify no dropped events.

## TODOs

- Define the canonical maestro project file structure for state extraction.
- Determine if `maestro status` provides structured JSON output or if raw file parsing is required.
- Evaluate whether recommendation rules should be configurable or hardcoded for MVP.
