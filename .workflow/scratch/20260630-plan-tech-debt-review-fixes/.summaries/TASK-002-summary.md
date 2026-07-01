# TASK-002: host-service-coordinator: real singleton + remove shared-type re-export

## Changes
- `apps/desktop/src/main/lib/host-service-coordinator.ts`: ISS-007 singleton + ISS-004 re-export removal. Module-level `let instance: HostServiceCoordinator | null = null;` (line 59) added before `getHostServiceCoordinator`; function body returns `(instance ??= new HostServiceCoordinator());` (line 63). The `export type { ... }` re-export block (formerly lines 16-25) and its backward-compat comment are gone — the `import type { ... } from "shared/host-info-types"` (lines 6-14) is retained for the class's own type usage.
- `apps/desktop/src/lib/trpc/routers/host-service-coordinator/index.ts`: ISS-004 consumer redirect. Combined import split into `import { getHostServiceCoordinator } from "main/lib/host-service-coordinator"` (line 3, value) and `import type { HostServiceStatusEvent } from "shared/host-info-types"` (line 4, type).

## Verification
- [x] C1 — `grep 'let instance: HostServiceCoordinator | null = null' host-service-coordinator.ts` → 1 match
- [x] C2 — `grep 'instance ??= new HostServiceCoordinator' host-service-coordinator.ts` → 1 match
- [x] C3 — `grep -n 'return new HostServiceCoordinator' host-service-coordinator.ts` → no matches (exit 1)
- [x] C4 — `grep -n 'export type {' host-service-coordinator.ts` → no matches (exit 1)
- [x] C5 — `grep -n 'import type { HostServiceStatusEvent } from "shared/host-info-types"' routers/host-service-coordinator/index.ts` → 1 match (line 4)
- [x] C6 — `grep -n 'type HostServiceStatusEvent' routers/host-service-coordinator/index.ts | grep 'main/lib/host-service-coordinator'` → no matches (exit 1)
- [x] C7 — `cd apps/desktop && bun run typecheck` → exit 0 (`tsc --noEmit` clean)

## Tests
- [x] `cd apps/desktop && bun run typecheck`: PASS — exit 0
- [x] `cd apps/desktop && bun test src/main/lib/host-service-coordinator.test.ts`: PASS — 0 fail / 1 todo / exit 0 (test file is a Phase 3 stub with a single `it.todo`; does not reference the singleton, unaffected by change)

## Deviations
- The code edits were already present in the working tree when execution began (likely applied during the prior run that was cut short by the API 503 before the summary was written). No code changes were made in this run; instead I verified the existing edits fully satisfy every convergence criterion and ran the typecheck + test gates to confirm. No functional deviation from the task's `action`/`files` spec — the on-disk state matches the target state exactly.

## Notes
- Runtime-function consumers (`getHostId`, `getHostServiceCoordinator` in device/settings/main.full/routers) import values, not types — confirmed unaffected by typecheck passing.
- The coordinator test file is a Phase 3 stub (`it.todo`); real singleton behavior is not yet covered by unit tests. Phase 4 should add singleton identity assertions (`getHostServiceCoordinator() === getHostServiceCoordinator()`).
- HostServiceCoordinator is now a true process-wide singleton via lazy `??=`; backward-compatible (export-as-function API unchanged).
