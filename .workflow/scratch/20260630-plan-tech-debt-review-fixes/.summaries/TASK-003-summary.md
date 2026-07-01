# TASK-003: openInFinder: add absolute-path validation mirroring openInApp

## Changes
- `apps/desktop/src/lib/trpc/routers/external/index.ts`: Replaced the bare `// Phase 4: 添加路径验证` TODO comment + `shell.showItemInFolder(input)` in the `openInFinder` mutation with an `if (!nodePath.isAbsolute(input))` guard that throws a `TRPCError` with `code: "BAD_REQUEST"` and message `openInFinder requires an absolute path (got ${JSON.stringify(input)}).`, mirroring the sibling `openInApp` guard. No imports changed — `nodePath` (line 2) and `TRPCError` (line 9) were already present.

## Verification
- [x] `grep -n 'isAbsolute'` returns at least 2 matches: confirmed 2 matches (line 150 openInFinder, line 172 openInApp)
- [x] `! grep -n 'Phase 4: 添加路径验证'` returns no matches: confirmed 0 matches (TODO deleted)
- [x] `grep -n 'openInFinder requires an absolute path'` returns one match: confirmed 1 match (line 153)
- [x] `grep -n 'code: "BAD_REQUEST"'` returns at least 4 matches: confirmed 4 matches (lines 37, 122, 152, 174 — withResolveGuard + openUrl + new openInFinder + openInApp)
- [x] `cd apps/desktop && bun run typecheck` exits 0: confirmed (tsc --noEmit, no output/errors)

## Tests
- [x] `cd apps/desktop && bun run typecheck`: pass (exit 0, clean)

## Deviations
- None. Inline guard approach was used per the task's `rationale.chosen_approach` (2 call sites with different input shapes — bare `z.string()` vs `z.object({path, ...})` — so a shared `assertAbsolutePath` helper would add indirection for negligible DRY benefit).

## Notes
- This is a behavior change (security fix): callers passing relative paths to `openInFinder` will now receive a BAD_REQUEST error. The task's risk note flags that renderer callers should pass absolute paths; a follow-up grep of renderer call sites could verify no caller relies on relative input, but that is out of scope for this task.
- Linked issue: ISS-20260630-001.
