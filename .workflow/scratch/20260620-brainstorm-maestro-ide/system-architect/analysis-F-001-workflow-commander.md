# F-001 — Workflow Commander

> Role: system-architect | Related decisions: SA-01, SA-02, SA-07

## Architecture

Workflow Commander is the primary orchestration surface for triggering maestro workflows. It consists of three layers:

1. **Frontend Panel (SvelteKit component)**: Renders workflow catalog, selection UI, and execution progress. Communicates with the backend via REST (catalog fetch) and WebSocket (execution progress).

2. **Backend Workflow Service**: Node.js service that wraps `maestro ralph skills --json --quiet` to retrieve the structured workflow catalog, and spawns CLI child processes for execution. Each workflow invocation creates a `WorkflowExecution` record tracked by the State Sync Engine (see F-005).

3. **CLI Adapter Layer**: Parses `maestro` CLI output into structured events. The adapter MUST abstract away version-specific output formatting so the frontend never consumes raw CLI text directly (see SA-06).

Module layout:
```
server/
  services/
    workflow-catalog.service.ts   # wraps `ralph skills --json`
    workflow-executor.service.ts  # spawns child_process per workflow
  adapters/
    cli-output-adapter.ts         # versioned output parsers
client/
  routes/
    commander/
      +page.svelte                # workflow selection UI
      workflow-progress.svelte    # step-level progress display
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `GET /api/workflows` | Backend -> Frontend | `{ workflows: WorkflowMeta[] }` where `WorkflowMeta = { id, name, stages, description }` |
| `POST /api/workflows/:id/execute` | Frontend -> Backend | `{ params: Record<string, unknown> }` returns `{ executionId: string }` |
| `WS event: workflow:step-update` | Backend -> Frontend | `{ executionId, stepIndex, status, output? }` |
| `WorkflowCatalogProvider` | Internal | Trait that fetches workflow definitions; default impl calls `maestro ralph skills` |

Consumers: Project Radar (F-002) reads execution status; Approval Gate (F-007) receives step-level pause events.

## Constraints (RFC 2119)

- The backend MUST spawn each workflow as a separate child process with a unique `executionId`; it MUST NOT execute workflows in-process.
- Workflow catalog retrieval MUST use `maestro ralph skills --json --quiet` as the primary data source (SA-07).
- The CLI adapter layer MUST intercept all CLI stdout/stderr before it reaches the frontend; raw CLI text MUST NOT be forwarded to UI components.
- Each workflow execution MUST emit `step-start`, `step-complete`, and `step-error` events on the WebSocket channel.
- The executor SHOULD support cancellation via `SIGINT` to the child process, propagated through the WebSocket as a `workflow:cancelled` event.
- The frontend MUST display workflow progress within 200ms of receiving a WebSocket event.

## Test Approach

- **Unit**: CLI adapter parsing with fixture output from maestro v-current and v-minus-1.
- **Integration**: Workflow execution end-to-end with a mock maestro binary that emits scripted output sequences.
- **Fuzz**: Malformed CLI output fed to the adapter layer to verify graceful degradation.
- **E2E**: Full stack test: select workflow -> trigger -> observe step progress -> completion.

## TODOs

- Define the exact `WorkflowMeta` schema once `maestro ralph skills --json` output is sampled.
- Determine whether multi-step workflows require a state machine on the backend or can rely on CLI exit codes alone.
- Evaluate whether long-running workflows need persistent execution state (survive server restart).
- Map `maestro delegate` subcommand flags to the workflow parameter schema.
