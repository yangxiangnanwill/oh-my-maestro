# TASK-006: Introduce Biome + convert 12 space-indented files to tab indentation

## Changes
- `apps/desktop/biome.json` (created): Biome 2.5.1 config with `indentStyle: "tab"`, `indentWidth: 2`, `lineEnding: "lf"`, linter `preset: "recommended"` (used `preset` instead of deprecated `recommended: true` — Biome 2.5.1 deprecates `recommended`; `rage` reports "Loaded successfully" with no Error). `files.includes` covers `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.d.ts`, `tsconfig.json` (tsconfig.json explicitly included so Biome handles its JSON formatting).
- `apps/desktop/package.json` (modified): added `@biomejs/biome: ^2.5.1` to devDependencies (via `bun add -d`); added 4 scripts — `lint`, `lint:fix`, `format`, `format:check`.
- 12 target files (modified, indentation only via `bunx biome format --write`):
  - `src/lib/trpc/routers/auth/utils/auth-functions.ts`
  - `src/renderer/routes/_authenticated/_dashboard/utils/workspace-navigation.ts`
  - `src/renderer/lib/presets/index.ts`
  - `src/renderer/stores/index.ts`
  - `tsconfig.json`
  - `src/shared/host-info-types.ts`
  - `src/main/lib/host-service-coordinator.ts`
  - `src/main/lib/terminal-host/process-tree-stub.ts`
  - `src/renderer/lib/terminal/link-providers-stub.ts`
  - `src/renderer/stores/tabs/store.ts`
  - `src/types/link-providers-route.d.ts`
  - `src/renderer/lib/tiptap-utils.ts`
- `src/shared/host-info-types.ts` (extra fix): converted empty `interface HostServiceCoordinatorEvents` → `type ... = Record<string, never>` to resolve `lint/suspicious/noEmptyInterface` ERROR (removed stale `// eslint-disable-next-line` comment; kept Phase 4 intent comment).
- `src/main/lib/host-service-coordinator.ts` (extra fix): replaced `(instance ??= new HostServiceCoordinator())` with explicit `if (!instance) { instance = new ... }` to resolve `lint/suspicious/noAssignInExpressions` ERROR.

## Verification
- [x] `test -f apps/desktop/biome.json` returns 0: PASS (file created).
- [x] `grep 'indentStyle' biome.json` = 1 match; `grep '"tab"' biome.json` = 1 match: PASS (line 8, `indentStyle: "tab"`).
- [x] `grep '"lint":' / '"lint:fix":' / '"format":' package.json` all present: PASS (lines 26-28).
- [x] `grep -c '@biomejs/biome' package.json` >= 1: PASS (1 match, `^2.5.1`).
- [x] `bunx biome format <file>` exits 0 for all 12 files (Biome 2.x has no `--check` flag; plain `biome format <file>` returns exit 0 when formatting matches config, exit 1 otherwise — all 12 return 0). Fallback `grep -Pn '^(  )+[^ ]'` returns 0 matches for all 12. `cat -A` confirms `^I` tab chars present. PASS.
- [x] `cd apps/desktop && bun run typecheck` exits 0: PASS (re-ran after lint fixes, still exit 0).
- [~] `cd apps/desktop && bun run lint` exits 0: **PARTIAL/DEVIATION** — scoped `bunx biome lint <12 files>` exits 0 (2 errors fixed, 11 warnings remain but warnings do not affect exit code). Full `bun run lint` exits 1 with 38 errors / 316 warnings across 1019 files — these are pre-existing repo-wide issues unrelated to indentation (project's first Biome introduction). See Deviations.

## Tests
- [x] `cd apps/desktop && bun run typecheck`: PASS (exit 0).
- [~] `cd apps/desktop && bun run lint`: FAIL (exit 1, 38 repo-wide pre-existing errors — out of scope; scoped 12-file lint passes).
- [x] `cd apps/desktop && bunx biome format <12 files>`: PASS (all exit 0, idempotent).

## Deviations
- **`recommended` → `preset`**: task action specified `"rules": { "recommended": true }`, but Biome 2.5.1 deprecates the `recommended` field (rage warning: "use preset instead"). Used `"preset": "recommended"` instead — semantically equivalent, removes deprecation. Config loads cleanly.
- **Biome 2.x has no `--check` flag**: convergence criteria referenced `bunx biome format --check <file>`. In Biome 2.x, plain `bunx biome format <file>` (no `--write`) is the check mode — exit 0 = formatted, exit 1 = would reformat. Used this equivalent command; all 12 exit 0. Fallback `grep -Pn '^(  )+[^ ]'` also confirms 0 two-space-indented lines.
- **2 lint ERRORs fixed beyond pure indentation**: `noEmptyInterface` (host-info-types.ts) and `noAssignInExpressions` (host-service-coordinator.ts) were surfaced by Biome on the 12 files. Per task instruction "fix, not suppress", fixed both with minimal semantic-preserving changes (empty interface → type alias; `??=` → explicit if). These are within the 12-file scope.
- **Full `bun run lint` does NOT exit 0**: convergence criteria 6 expected `bun run lint` to exit 0, but the project's first Biome run surfaces 38 errors + 316 warnings across 1019 files (pre-existing, repo-wide — unused imports, `let`→`const`, unused params in stubs, etc.). Per task rationale: "the initial `bun run lint` may surface pre-existing lint issues beyond the 12 files — if so, scope the first lint pass to the 12 files only, and file a follow-up for repo-wide lint cleanup." Scoped 12-file lint passes (exit 0 after 2 error fixes). **Follow-up issue needed** for repo-wide lint cleanup (separate from this task's 12-file scope).
- **Pre-existing uncommitted changes from TASK-001~005**: working tree had unstaged content changes in several of the 12 files (e.g. tsconfig.json `noImplicitAny: false→true`, removed `@superset/local-db` path; host-service-coordinator.ts comment edits) made by prior completed tasks that were never committed. Verified via `git show HEAD:<file>` + Biome format that **Biome did not introduce these content changes** — Biome only changed whitespace (tabs) + line-width line-wrapping. The content diffs belong to TASK-001~005, not this task. No commit was made per task instruction "不自动 git commit".
- **Biome line-width reformatting (non-indent whitespace changes)**: Biome's formatter (default line-width 80) also re-wrapped some long lines into multi-line and merged some short multi-line statements into single lines in: auth-functions.ts, workspace-navigation.ts, stores/index.ts, link-providers-stub.ts, tabs/store.ts, tiptap-utils.ts. These are standard formatter behavior (line-width), not semantic changes — `git diff --ignore-all-space` confirms no semantic token changes from Biome. Documented per task's "per-file diff review" requirement.

## Notes
- `biome.json` itself is written with tab indentation (manually, since it's not in its own `files.includes`).
- `package.json` retains 2-space indentation (not in `files.includes`; kept existing style to minimize non-task changes). If tab consistency is desired for package.json, add it to `files.includes` in a follow-up (Biome's JSON formatter would reformat it).
- 11 lint warnings remain on the 12 files (noUnusedImports, useConst, noUnusedFunctionParameters in stub files) — these are warnings (do not affect exit code) and mostly in `// Phase 4 stub` files where unused params/imports are intentional placeholders. Left unfixed to keep this task scoped to indentation + the 2 blocking errors; recommend a follow-up stub-cleanup pass.
- **Next task / follow-up**: (1) repo-wide `bun run lint` cleanup (38 errors); (2) commit the accumulated TASK-001~005 + TASK-006 working-tree changes (currently all unstaged).
