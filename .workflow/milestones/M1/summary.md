# Milestone: M1 — MVP — Workflow Visualization

**Completed**: 2026-06-21
**Artifacts**: 11 (roadmap: 1, analyze: 1, plan: 3, execute: 3, review: 2, verify: 1)

## Key Outcomes

- **CLI Adapter Layer** — Versioned registry with NDJSON parsing, enabling Maestro IDE to discover and execute maestro-flow workflows
- **Delegate Executor** — Subprocess management with output stream parsing, bridging `maestro delegate` CLI to EventBus-driven WebSocket events
- **EventBus + WebSocket Gateway** — Typed publish-subscribe backbone with per-client message isolation and mode-aware translation
- **State Sync Engine** — Dual-source state merging (in-process CLI events + filesystem watcher) with debounced file events
- **Project Radar** — Svelte tree component rendering milestone/phase/step status with expand/collapse and simple/advanced mode translation
- **Workflow Commander** — Card list + execution panel with step-by-step progress tracking, response contract validation, and retry support
- **83 tests across 6 test files**, all passing; `npx tsc --noEmit` exits 0

## Learnings

- **Dependency Injection for Subprocess Calls**: Use constructor parameters (execFn, spawnFn) with defaults — type-safe, no hoisting issues
- **Different Error Strategies for Stream vs Batch Parsing**: Stream parsers return null for invalid lines; batch parsers throw
- **Safe Wave Merging**: Tasks from different waves can run concurrently if zero file overlap
- **EventBus as Integration Backbone**: All server components communicate through typed events and channels
- **Svelte 5 $effect Cleanup**: Always return unsubscribe function from store subscriptions inside $effect
- **Per-Client Message Creation**: Create new WSMessage inside broadcast loop, not outside
- **Error Type Discrimination**: Use instanceof in catch blocks for known vs unknown errors

## Next Milestone

**M2: Usable — AI & Terminal** — Terminal Bridge (xterm.js + node-pty) + AI Dialog (Claude Code integration)
