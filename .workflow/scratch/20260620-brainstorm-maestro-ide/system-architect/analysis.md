# System Architect Analysis -- Maestro IDE

> Contract: guidance-specification.md section 5 (decisions SA-01 through SA-07)
> Owns: Architecture topology, technology selection, process management, state synchronization, CLI integration layer, error handling, observability
> Does not own: UX interaction patterns (UX-01..UX-06), UI layout and visual design (UI-01..UI-07), product prioritization (PM-01..PM-06)

## 1. Role Mandate

The System Architect decides how Maestro IDE is structured as a local web application, how backend services compose, and how the system integrates with the maestro CLI and Claude Code. This role owns the technology stack (SA-04), the event-driven WebSocket architecture (SA-03), the CLI adapter abstraction (SA-06), and process lifecycle management via node-pty (SA-05). It defers UX interaction patterns to the UX Expert, visual layout to the UI Designer, and product scope to the Product Manager. The architect is in this brainstorm to ensure every feature maps to a concrete module boundary, a defined interface contract, and a verifiable constraint so that downstream implementation can proceed without ambiguity.

## 2. Decision Digest

### Decisions

| ID | Feature | Stance | Constraints (RFC 2119) |
|----|---------|--------|------------------------|
| SA-01 | cross-cutting | Local web app architecture (HTTP/WS server + browser frontend) | Product MUST use local web app architecture |
| SA-02 | F-001, F-003, F-007 | Gradual Claude Code integration: CLI child process first, API direct later | CLI child process MUST be the initial integration strategy; API direct is a future optimization |
| SA-03 | F-005, F-002 | Event-driven + WebSocket state sync backbone | State sync MUST use event-driven WebSocket architecture; polling MUST NOT be used |
| SA-04 | cross-cutting | Node.js backend, SvelteKit frontend | Backend MUST use Node.js; frontend MUST use SvelteKit |
| SA-05 | F-004 | Terminal output via xterm.js + WebSocket streaming | Terminal output MUST stream through xterm.js + WebSocket |
| SA-06 | F-001, F-003, F-006, F-007 | CLI output parsing abstracted into adapter layer | CLI output parsing MUST be abstracted; raw CLI text MUST NOT reach the frontend |
| SA-07 | F-001, F-002 | Structured command data via maestro ralph skills --json --quiet | Backend SHOULD support structured JSON output from maestro CLI |

### Interfaces

| Name | Contract | Consumers |
|------|----------|-----------|
| GET /api/workflows | { workflows: WorkflowMeta[] } | F-001 Workflow Commander frontend |
| POST /api/workflows/:id/execute | { params } -> { executionId } | F-001 frontend, F-007 Approval Gate |
| WS workflow:step-update | { executionId, stepIndex, status, output? } | F-001 frontend, F-002 Project Radar |
| GET /api/projects/:id/state | ProjectState = { milestones: Milestone[] } | F-002 frontend |
| WS project:state-update | { projectId, changedPaths, snapshot } | F-002 frontend, F-001 recommendations |
| GET /api/projects/:id/recommendations | { recommendations: Recommendation[] } | F-002 frontend |
| POST /api/dialog/sessions | {} -> { sessionId } | F-003 frontend |
| WS dialog:stream-chunk | { sessionId, messageId, chunk, done } | F-003 frontend |
| WS dialog:intent-routed | { sessionId, intent, targetFeature? } | F-003 frontend, F-001, F-002 |
| POST /api/terminals | { cwd?, command? } -> { terminalId } | F-004 frontend |
| WS term:output / term:input / term:resize | { terminalId, data } or { terminalId, cols, rows } | F-004 xterm.js frontend |
| EventBus.publish(channel, event) | { type, timestamp, payload } | All backend services |
| WS /ws with subscribe protocol | { op: subscribe, channels } | All frontend features |
| Translator.translate(payload, level) | Transformed payload with term substitution | F-006 middleware, all responses |
| WS gate:pending | { gateId, executionId, stepIndex, diff?, dryRunResult? } | F-007 frontend |
| POST /api/gates/:id/approve | {} -> { resumed } | F-007 frontend |
| POST /api/gates/:id/reject | { reason? } -> { cancelled } | F-007 frontend |
| POST /api/intents/classify | { input: string, context? } -> { workflowId, confidence, params } | F-003 AI Dialog, F-001 Workflow Commander |
| WS gate:resolved | { gateId, decision, executionId, resumed } | F-005 State Sync Engine, F-001 Workflow Commander |
| Translator.translate(payload, level) | { translated: Payload, untranslatedTerms: string[], mode } | F-006 middleware, all responses — server handles label substitution; client handles visibility via shouldHide |

### Cross-Cutting Positions

| Topic | Stance |
|-------|--------|
| Process isolation | Each CLI invocation MUST run as a separate child process; shared-process execution is prohibited |
| Adapter versioning | CLI adapters MUST be versioned; the system MUST detect CLI version at startup and select the matching adapter |
| Platform compatibility | Windows conpty quirks MUST be handled with platform-specific PTY control strategies; Unix signals MUST NOT be assumed available on Windows |
| Dual-source state model | State Sync Engine MUST merge in-process events and file-system watcher events; externally triggered changes MUST be labeled as such |
| Concept leak prevention | All responses MUST pass through the Concept Translator middleware before reaching the frontend; raw technical terms MUST NOT leak in simple mode |
| Resource limits | The system MUST enforce a maximum of 5 concurrent terminal sessions per user and 10 concurrent WebSocket connections |
| Data integrity | Translations MUST NOT modify data values; only keys and labels are substituted |
| Audit trail | Approval decisions MUST be logged with timestamp and user identity |

### Findings Summary

| Slug | Title | Impact |
|------|-------|--------|
| cli-adapter-versioning | CLI Adapter Versioning Strategy | HIGH -- adapter layer requires version detection and per-version test fixtures to prevent CLI output format breakage |
| cli-state-desync | CLI-GUI State Desynchronization | HIGH -- dual-source state model needed to reconcile in-process and externally triggered changes |
| windows-conpty-stability | Windows ConPTY Stability Risk | MEDIUM -- platform-specific PTY control strategies required; SIGTSTP unreliable on Windows |

## 3. Cross-Cutting Foundations

### Data Model

Five core entities underpin the system:

1. **WorkflowExecution** -- { id, workflowId, params, status, steps: Step[], startedAt, completedAt } -- represents a single workflow run, tracked by the State Sync Engine.
2. **ProjectState** -- { projectId, milestones: Milestone[] } where Milestone = { id, name, phases: Phase[] } -- the aggregated project tree consumed by Project Radar.
3. **DialogSession** -- { sessionId, cliProcessId, createdAt, lastActivityAt, status } -- maps one-to-one with a Claude Code CLI child process.
4. **TerminalSession** -- { terminalId, ptyPid, cwd, cols, rows, status } -- a node-pty process managed by the PTY Manager.
5. **ApprovalGate** -- { gateId, executionId, stepIndex, status, diff?, createdAt, resolvedAt } -- lifecycle managed by the approval state machine.

Relationships: WorkflowExecution references ApprovalGate (one-to-many per step); DialogSession may spawn a WorkflowExecution via intent routing; TerminalSession is independent but monitored by State Sync Engine for lifecycle events.

### State Machine

The **ApprovalGate** lifecycle is the most safety-critical state machine in the system:

```
                 +-----------+
                 |  created  |
                 +-----+-----+
                       |
                 +-----v-----+
          +----->|   pending  |
          |      +-----+-----+
          |            |
          |   +--------+--------+
          |   |                 |
    +-----v---v--+     +-------v--------+
    |  expired   |     | awaiting_input  |
    +-----+------+     +-------+---------+
          |                     |
          |            +--------+--------+
          |            |                 |
    +-----v-----+ +---v--------+ +-----v------+
    | rejected  | |  approved  | |  rejected  |
    +-----------+ +------------+ +------------+
```

Transition table:

| From | To | Trigger | Side effect |
|------|----|---------|-------------|
| created | pending | Step marked requiresApproval: true | Pause child process, emit gate:pending |
| pending | expired | 10-minute timeout | Reject gate, SIGINT child process |
| pending | awaiting_input | User opens approval panel | Display diff preview |
| awaiting_input | approved | POST /api/gates/:id/approve | Resume child process, log decision |
| awaiting_input | rejected | POST /api/gates/:id/reject | SIGINT child process, log decision |
| expired | rejected | Automatic | Emit gate:rejected event |

### Error Handling Strategy

Errors are classified into three tiers:

1. **Recoverable** -- CLI adapter parse failures, transient WebSocket disconnects. The system MUST retry with exponential backoff (max 3 attempts) and degrade gracefully (show partial data with a warning badge).
2. **Degraded** -- File-system watcher failure, conpty resize errors. The system MUST log the error, switch to polling fallback (30s interval), and display a "live updates paused" indicator.
3. **Fatal** -- Port conflict on startup, maestro CLI not found, incompatible CLI version. The system MUST fail fast with a clear error message and exit code; it MUST NOT start in a partially functional state.

All CLI child process crashes MUST be captured via exit-code inspection and reported as workflow:step-error or terminal:exit events. The State Sync Engine MUST propagate error state to all subscribed clients within 100ms.

### Observability Requirements

| Metric | Target | Collection |
|--------|--------|------------|
| WebSocket event delivery latency | < 100ms p99 | Server-side histogram on EventBus.publish to WS send |
| CLI child process spawn time | < 500ms p99 | Server-side timer on spawn call |
| File-system watcher event-to-UI latency | < 500ms | End-to-end timestamp diff |
| WebSocket connection uptime | > 99.5% | Heartbeat success rate (30s interval) |
| Active terminal sessions | <= 5 per user | Gauge on PTY Manager |
| Event ring buffer utilization | < 80% capacity | Gauge on EventStore |
| Approval gate resolution time | < 10 min (before expiry) | Timer from gate:pending to resolved |
| Concept translator processing overhead | < 10ms per response | Server-side timer on translate() |

Health check endpoint: GET /api/health MUST return { status, uptime, wsConnections, activeProcesses }. Log events: every event-bus publication, every CLI process spawn/exit, every WebSocket connect/disconnect, every gate state transition.

### Configuration Model

| Parameter | Default | Validation | Scope |
|-----------|---------|------------|-------|
| PORT | 3210 | 1024-65535 integer | Server startup |
| WS_HEARTBEAT_INTERVAL_MS | 30000 | >= 5000 | WebSocket gateway |
| EVENT_RING_BUFFER_SIZE | 1000 | >= 100 | Event store |
| SNAPSHOT_INTERVAL_MS | 30000 | >= 10000 | Snapshot service |
| MAX_TERMINAL_SESSIONS | 5 | >= 1 | PTY manager |
| GATE_EXPIRY_MS | 600000 | >= 60000 | Approval state service |
| DIALOG_IDLE_TIMEOUT_MS | 600000 | >= 60000 | Dialog session manager |
| DETAIL_LEVEL | simple | simple or advanced | Concept translator |
| MAESTRO_CLI_PATH | maestro | Non-empty string, must resolve to executable | CLI adapter |

All parameters MUST be overridable via environment variables. The server MUST validate all values at startup and MUST NOT start with invalid configuration.

### Boundary Scenarios

- **Concurrency**: Two browser tabs connected simultaneously. The WebSocket gateway MUST deliver events to all connected clients; the event ring buffer MUST be shared across connections. Approval gate decisions from any connection MUST be authoritative.
- **Rate limiting**: A burst of 1000 file-system change events in 1 second. The state aggregation service MUST debounce file-system events with a 200ms window; it MUST NOT attempt to process each event individually.
- **Graceful shutdown**: Server receives SIGTERM. The system MUST (1) stop accepting new WebSocket connections, (2) drain pending events from the Event Bus, (3) SIGINT all child processes, (4) close WebSocket connections, (5) exit within 10 seconds.
- **Cleanup**: Browser tab closed without logout. WebSocket heartbeat MUST detect the stale connection within 30 seconds; the PTY Manager MUST kill orphaned terminal sessions within 5 seconds of disconnect detection.
- **Scalability ceiling**: Single-user local app. The architecture MUST NOT over-engineer for multi-tenancy; the WebSocket gateway MUST support at least 10 concurrent connections (multiple browser tabs) but need not scale beyond that.
- **Disaster recovery**: Server crash mid-workflow. The system SHOULD NOT attempt automatic workflow resumption on restart; it MUST mark all in-flight executions as interrupted and present the user with a manual recovery option.

## 4. File Index

| File | Type | Feature | Headings |
|------|------|---------|----------|
| [analysis-F-001-workflow-commander.md](analysis-F-001-workflow-commander.md) | feature | F-001 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-002-project-radar.md](analysis-F-002-project-radar.md) | feature | F-002 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-003-ai-dialog.md](analysis-F-003-ai-dialog.md) | feature | F-003 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-004-terminal-bridge.md](analysis-F-004-terminal-bridge.md) | feature | F-004 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-005-state-sync-engine.md](analysis-F-005-state-sync-engine.md) | feature | F-005 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-006-concept-translator.md](analysis-F-006-concept-translator.md) | feature | F-006 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-007-approval-gate.md](analysis-F-007-approval-gate.md) | feature | F-007 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [findings-cli-adapter-versioning.md](findings-cli-adapter-versioning.md) | finding | -- | Description, Affected Features, Recommendation |
| [findings-cli-state-desync.md](findings-cli-state-desync.md) | finding | -- | Description, Affected Features, Recommendation |
| [findings-windows-conpty-stability.md](findings-windows-conpty-stability.md) | finding | -- | Description, Affected Features, Recommendation |

## 5. Outstanding TODOs

1. **CLI adapter version detection**: Implement startup probe of maestro --version to select the correct adapter; define adapter interface contract for test fixtures (see findings-cli-adapter-versioning).
2. **WorkflowMeta schema**: Sample actual maestro ralph skills --json --quiet output to finalize the WorkflowMeta type definition (F-001).
3. **PTY pause mechanism for Windows**: Investigate alternatives to SIGTSTP/SIGCONT for Approval Gate process pausing on conpty (F-007, findings-windows-conpty-stability).
4. **Dual-source state reconciliation**: Define the event schema that merges in-process execution events with file-system watcher events, including the externally triggered label (F-005, findings-cli-state-desync).
5. **WebSocket library selection**: Decide between ws and socket.io; lean toward ws for lighter weight (F-005).
6. **Event type taxonomy**: Define the complete typed event catalog for all channels (F-005).
7. **Intent classification strategy**: Determine whether the AI Dialog intent router uses rule-based matching or a lightweight ML classifier for MVP (F-003).
8. **Translation registry completeness**: Map all maestro terms from guidance section 2 to user-facing labels; define handling for untranslated terms (F-006).
9. **Ring buffer persistence**: Evaluate whether the Event Store ring buffer needs disk backing for crash recovery or if replay-from-scratch is acceptable (F-005).
10. **Claude Code CLI session model**: Determine whether Claude Code supports interactive stdin/stdout sessions or requires per-command invocation (F-003).
