# Task: TASK-047 Wave 3: hooks/ 业务 — host-service/ + ports/

## Implementation Summary

### Files Created

**host-service/ hooks (10 hooks, 21 files):**

- `apps/desktop/src/renderer/hooks/host-service/useDestroyWorkspace/useDestroyWorkspace.ts` — Workspace destroy/inspect hook with typed error handling
- `apps/desktop/src/renderer/hooks/host-service/useDestroyWorkspace/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useDiffStats/useDiffStats.ts` — Git diff stats (additions/deletions) hook
- `apps/desktop/src/renderer/hooks/host-service/useDiffStats/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useFileTree/useFileTree.ts` — File tree state management with FS watch events
- `apps/desktop/src/renderer/hooks/host-service/useFileTree/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useGitStatus/useGitStatus.ts` — Git status query with live invalidation
- `apps/desktop/src/renderer/hooks/host-service/useGitStatus/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useGitStatusMap/useGitStatusMap.ts` — Git status map derivation for file tree decoration
- `apps/desktop/src/renderer/hooks/host-service/useGitStatusMap/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useHostTargetUrl/useHostTargetUrl.ts` — Host URL resolver hook
- `apps/desktop/src/renderer/hooks/host-service/useHostTargetUrl/resolveHostUrl.ts` — Pure host URL resolver
- `apps/desktop/src/renderer/hooks/host-service/useHostTargetUrl/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useSendToTerminalAgent/useSendToTerminalAgent.ts` — Terminal agent prompt sender
- `apps/desktop/src/renderer/hooks/host-service/useSendToTerminalAgent/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useTerminalAgentBindings/useTerminalAgentBindings.ts` — Terminal agent binding lookup
- `apps/desktop/src/renderer/hooks/host-service/useTerminalAgentBindings/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useWorkspaceEvent/useWorkspaceEvent.ts` — Event bus subscription hook
- `apps/desktop/src/renderer/hooks/host-service/useWorkspaceEvent/index.ts` — Barrel export
- `apps/desktop/src/renderer/hooks/host-service/useWorkspaceHostUrl/useWorkspaceHostUrl.ts` — Workspace host target resolver
- `apps/desktop/src/renderer/hooks/host-service/useWorkspaceHostUrl/index.ts` — Barrel export

**ports/ hooks (1 hook, 4 files):**

- `apps/desktop/src/renderer/hooks/ports/usePortKillActions/usePortKillActions.ts` — Port kill actions hook
- `apps/desktop/src/renderer/hooks/ports/usePortKillActions/killPortTarget.ts` — Port kill target executor
- `apps/desktop/src/renderer/hooks/ports/usePortKillActions/killPortTarget.test.ts` — Tests (3 passing)
- `apps/desktop/src/renderer/hooks/ports/usePortKillActions/index.ts` — Barrel export

### Supporting Stubs Created

- `apps/desktop/src/renderer/lib/workspace-client-stub.ts` — Stub for @superset/workspace-client (workspaceTrpc, getEventBus, payload types)
- `apps/desktop/src/renderer/lib/workspace-fs-types.ts` — Stub for @superset/workspace-fs/client (FsEntry, FsEntryKind, FsWatchEvent)
- `apps/desktop/src/renderer/lib/host-service-types.ts` — Stub for @superset/host-service types (TeardownFailureCause, DeleteInProgressCause)
- `apps/desktop/src/renderer/lib/host-routing.ts` — Stub for @superset/shared/host-routing (buildHostRoutingKey)
- `apps/desktop/src/renderer/lib/host-service/host-service-router.ts` — Expanded AppRouter stub with HostServiceProcedures interface
- `apps/desktop/src/renderer/lib/host-service-client.ts` — Added getHostServiceProcedures() typed accessor
- `apps/desktop/src/renderer/lib/auth-client.ts` — Updated useSession return type for compatibility
- `apps/desktop/src/renderer/routes/_authenticated/providers/LocalHostServiceProvider.tsx` — Provider stub
- `apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider.tsx` — Provider stub
- `apps/desktop/src/renderer/hooks/useRelayUrl.ts` — Relay URL hook stub

### @superset References Replaced

| Original Import | Replacement |
|----------------|-------------|
| `@superset/host-service` (types) | `renderer/lib/host-service-types` |
| `@superset/host-service` (AppRouter) | `renderer/lib/host-service/host-service-router` |
| `@superset/workspace-client` (workspaceTrpc) | `renderer/lib/workspace-client-stub` |
| `@superset/workspace-client` (getEventBus, payloads) | `renderer/lib/workspace-client-stub` |
| `@superset/workspace-fs/client` (FsEntry, FsWatchEvent) | `renderer/lib/workspace-fs-types` |
| `@superset/shared/host-routing` (buildHostRoutingKey) | `renderer/lib/host-routing` |
| `@superset/ui/sonner` (toast) | `renderer/lib/toast` |

### Verification

- [x] All 10 host-service hook directories exist
- [x] ports/usePortKillActions directory exists
- [x] Zero @superset references in host-service/ hooks
- [x] Zero @superset references in ports/ hooks
- [x] No TypeScript errors in new files (34 pre-existing errors unrelated)
- [x] killPortTarget tests pass (3/3)

## Status: Complete
