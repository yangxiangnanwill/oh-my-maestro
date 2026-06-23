# ADR-002: CLI Subprocess Integration (Gradual Strategy)

> Status: Accepted
> Date: 2026-06-20
> Deciders: System Architect, Product Manager
> Related Constraints: C-004

## Context

Maestro IDE must integrate with two CLI tools: the `maestro` CLI (workflow orchestration, project state queries) and Claude Code CLI (AI dialog, code generation). The integration must support:

1. Spawning and managing CLI processes with full lifecycle control
2. Streaming stdout/stderr output in real-time to the browser
3. Parsing structured data from CLI output for visualization
4. Pausing/resuming processes for approval gates
5. Handling interactive sessions (Claude Code stdin/stdout)

We must decide whether to integrate via CLI subprocess (spawning `maestro` and `claude` as child processes) or via direct API calls (if maestro or Claude Code expose HTTP/SDK APIs).

## Decision

We WILL adopt a **gradual integration strategy**: CLI subprocess as the initial integration method, with API direct integration as a future optimization.

**Phase 1 (MVP)**: All maestro and Claude Code interactions are performed by spawning CLI child processes via `child_process.spawn` and `node-pty`. The backend wraps each invocation, parses output through the CLI Adapter layer, and streams results via WebSocket.

**Phase 2 (Future)**: If maestro or Claude Code expose stable HTTP/SDK APIs, migrate specific interactions to direct API calls for lower latency and richer structured responses. The CLI Adapter abstraction layer ensures this migration is transparent to the frontend.

```
Phase 1 (MVP):
  Frontend -> REST/WS -> Backend -> child_process.spawn("maestro ...") -> CLI stdout -> Adapter -> WS -> Frontend

Phase 2 (Future):
  Frontend -> REST/WS -> Backend -> HTTP API call to maestro/Claude Code -> Structured JSON -> WS -> Frontend
```

## Alternatives Considered

### 1. Direct API Integration (HTTP/SDK)

**Pros**:
- Lower latency: no process spawn overhead (~50-500ms per invocation)
- Structured responses: APIs return typed JSON, no parsing needed
- No PTY management complexity
- Better error handling: HTTP status codes vs. exit codes and stderr parsing
- Session persistence: API sessions can outlive process lifetime

**Cons**:
- **maestro CLI has no HTTP API**: As of 2026-06, maestro is a CLI-only tool. There is no REST API, SDK, or library interface. Building an API server for maestro is a separate project.
- **Claude Code API access is limited**: Claude Code's primary interface is CLI. While Anthropic provides the Messages API, Claude Code's workflow-specific features (delegate, chain, skill) are CLI-only.
- **Premature optimization**: Investing in API integration before validating the product concept risks building infrastructure for a product that may pivot.
- **Coupling risk**: Direct API integration couples Maestro IDE to specific API versions and authentication mechanisms. CLI subprocess is more loosely coupled.

**Verdict**: Not available for MVP. Revisit when maestro or Claude Code expose stable APIs.

### 2. CLI Subprocess Only (No Future API Migration)

**Pros**:
- Simpler architecture: no abstraction layer needed for future API migration
- Less upfront design: no need to design the Adapter interface for dual-mode operation

**Cons**:
- Process spawn overhead persists permanently (~50-500ms per invocation)
- CLI output parsing remains a permanent maintenance burden
- Cannot benefit from future API improvements without architectural changes
- PTY management complexity (Windows conpty, signal handling) remains forever

**Verdict**: Rejected. The gradual strategy costs little extra (the Adapter layer is needed anyway for version resilience) and preserves the option to migrate.

### 3. Hybrid: CLI for maestro, API for Claude Code

**Pros**:
- Uses the best available interface for each tool
- Claude Code's Messages API provides structured responses for AI dialog
- maestro CLI subprocess for workflow orchestration (no API available)

**Cons**:
- Two integration patterns to maintain from day one
- Claude Code's Messages API does not expose workflow-specific features (delegate, chain, skill)
- API authentication management (API keys, token refresh) adds complexity
- Inconsistent error handling between CLI and API paths

**Verdict**: Considered but deferred. The AI Dialog feature (F-003) could benefit from the Messages API for streaming, but the CLI subprocess approach provides a unified integration pattern and access to all Claude Code features. Revisit in Phase 2 if the Messages API proves necessary for performance.

## Consequences

### Positive

- **Fastest path to working product**: CLI subprocess integration works today with existing maestro and Claude Code installations. No API development needed.
- **Full feature coverage**: CLI subprocess can invoke any maestro command, including future commands not yet designed. API integration would be limited to explicitly supported endpoints.
- **Loose coupling**: The CLI Adapter layer isolates the frontend from CLI output format changes. Version detection at startup selects the correct adapter.
- **Future optionality**: The Adapter abstraction preserves the ability to swap CLI subprocess for API calls without frontend changes.

### Negative

- **Process spawn overhead**: Each CLI invocation costs 50-500ms for process creation. Mitigation: long-running sessions (AI Dialog) maintain a persistent CLI process; one-shot commands (workflow catalog) accept the overhead.
- **CLI output parsing fragility**: CLI output formats may change between versions. Mitigation: versioned adapters with per-version test fixtures; CI gate against latest CLI release.
- **PTY management complexity**: Windows conpty quirks, signal handling differences, resize events. Mitigation: platform-specific PTY control strategies; Windows CI pipeline.
- **Limited structured output**: CLI tools may not support `--json` for all commands. Mitigation: `maestro ralph skills --json --quiet` for catalog; adapter parsing for other commands.
- **Process lifecycle management**: Must handle crashes, hangs, orphaned processes. Mitigation: exit code inspection, SIGINT timeout, orphan cleanup on WebSocket disconnect.

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CLI output format breaks after update | High | High | Versioned adapters; startup version detection; CI gate against latest release |
| Claude Code CLI does not support interactive sessions | Medium | High | Fallback to per-command invocation; session context managed client-side |
| Process spawn latency degrades UX | Low | Medium | Persistent sessions for AI Dialog; pre-warm catalog cache |
| Windows conpty instability | Medium | Medium | Platform-specific PTY strategies; Windows CI; output buffering as fallback |
| Orphaned processes after server crash | Low | Medium | Process tracking with PID files; cleanup on startup |

## References

- SA-02: Gradual Claude Code integration decision
- SA-06: CLI output parsing adapter layer
- SA-07: Structured command data via `maestro ralph skills --json`
- Finding: CLI Adapter Versioning Strategy
- Finding: Windows ConPTY Stability Risk
