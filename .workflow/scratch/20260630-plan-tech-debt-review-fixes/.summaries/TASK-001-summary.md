# TASK-001: tsconfig: restore noImplicitAny + redirect @superset/shared/* main-layer aliases to @main/*

## Changes
- `apps/desktop/tsconfig.json`: Set `"noImplicitAny": true`; deleted the 2 Phase-4 comment lines above it; removed 13 main-layer `@superset/*` path entries that mapped into `src/main/lib/*` (local-db, shared/agent-command, shared/shell-ready-scanner, shared/workspace-launch, shared/simple-git-options, pty-daemon, pty-daemon/process-tree, pty-daemon/protocol, port-scanner, chat/server/{trpc,desktop,shared}, workspace-fs/host). Kept `@superset/mcp-v2/tools/register` (runtime dynamic-import safety net), all 6 true-shared `@superset/shared/*` aliases (agent-catalog, host-info, constants, auto-update, terminal-link-parsing, agent-launch), `@superset/workspace-client`, and all `@superset/ui/*` stubs.
- `apps/desktop/src/main/index.full.ts:3`: `import { settings } from "@superset/local-db"` → `from "@main/lib/local-db"` (runtime value import).
- `apps/desktop/src/main/pty-daemon/index.ts:33-39`: `@superset/pty-daemon` → `@main/lib/terminal-host/pty-daemon-stub`; `@superset/pty-daemon/protocol` → `@main/lib/terminal-host/pty-daemon-protocol`.
- `apps/desktop/src/main/terminal-host/session.ts:19`: `@superset/shared/shell-ready-scanner` → `@main/lib/terminal-host/shell-ready-scanner`. Also updated line-168 comment to reference `@main/lib/terminal-host`.
- `apps/desktop/src/main/terminal-host/pty-subprocess.ts:17`: `@superset/pty-daemon/process-tree` → `@main/lib/terminal-host/process-tree-stub`.
- `apps/desktop/src/main/lib/host-service-coordinator.ts:2`: Updated comment — `@superset/local-db` → `@main/lib/local-db`, `@superset/shared/host-info` → `shared/host-info-types` (functional imports already correct, no code change).
- `apps/desktop/src/renderer/commandPalette/core/types.ts:1`: `@superset/local-db` → `@main/lib/local-db` (type-only).
- `apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts:1`: `@superset/local-db` → `@main/lib/local-db` (type-only).
- `apps/desktop/src/renderer/components/OpenInButton/OpenInButton.tsx:1`: `@superset/local-db` → `@main/lib/local-db` (type-only).
- `apps/desktop/src/renderer/components/OpenInExternalDropdown/constants.ts:1`: `@superset/local-db` → `@main/lib/local-db` (type-only).
- `apps/desktop/src/renderer/components/OpenInExternalDropdown/OpenInExternalDropdownItems.tsx:1`: `@superset/local-db` → `@main/lib/local-db` (type-only).
- `apps/desktop/src/renderer/lib/agent-session-orchestrator/types.ts:1`: `@superset/local-db` → `@main/lib/local-db` (type-only).

## Verification
- [x] `grep '"noImplicitAny": true' apps/desktop/tsconfig.json returns exactly one match`: grep count = 1
- [x] `! grep -n '"noImplicitAny": false' apps/desktop/tsconfig.json returns no matches`: confirmed, no matches
- [x] No main-layer @superset/* import statements remain: grep for import/from lines (comments excluded) returned 0 matches (exit 1)
- [x] `cd apps/desktop && bun run typecheck exits 0`: confirmed EXIT=0
- [x] Keep-list grep — correctly-shared + safety-net aliases preserved: all 8 keep-list tsconfig path entries retained (agent-catalog, host-info, constants, auto-update, terminal-link-parsing, agent-launch, workspace-client, mcp-v2/tools/register); code grep shows matches for 6 of 7 patterns (auto-update has 0 active importers but alias retained and correctly points to src/shared/auto-update.ts)

## Tests
- [x] `cd apps/desktop && bun run typecheck`: PASS — `tsc --noEmit` exit 0, no errors
- [x] `grep -rnE '^import .*from .@superset/(local-db|...)' ... | grep -vE '^\s*//'`: PASS — no matches (exit 1)

## Deviations
- Found an extra import site not enumerated in task `files[]`: `src/main/pty-daemon/index.ts:33` imports from bare `@superset/pty-daemon` (the stub alias). Migrated it to `@main/lib/terminal-host/pty-daemon-stub` (same file the removed alias pointed to). This is within scope (apps/desktop/src/main/pty-daemon/ is a focus_path) and required for typecheck to pass.
- `src/lib/trpc/routers/external/index.ts` already used `main/lib/local-db` (not `@superset/local-db`) — no change needed, verified.
- The 6 aliases with zero active importers (agent-command, workspace-launch, simple-git-options, port-scanner, chat/server/*, workspace-fs/host) were removed from tsconfig without adding `@main/*` equivalents, per task instruction "delete if redundant" — `lib/*` already covers those targets if any future importer needs them.
- Updated one additional descriptive comment in `session.ts:168` that referenced the now-removed `@superset/shared` alias (changed to `@main/lib/terminal-host`); not a functional change.

## Notes
- `@superset/mcp-v2/tools/register` is INTENTIONALLY preserved — it is a runtime dynamic `await import(...)` inside try-catch in `maestro-mcp-provider.ts:570`, paired with a pure `declare module` type stub in `superset-registry.d.ts`. Do NOT migrate or remove it in future tasks.
- `noImplicitAny: true` required zero code fixes — the codebase was already clean (ISS-005 verified).
- `host-service-coordinator.ts` was modified by TASK-002 (singleton + re-export removal); this task only updated its line-2 comment, no logic conflict.
