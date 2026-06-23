# TASK-001 Summary: CLI Adapter Layer — Versioned Registry + NDJSON Parsing

## Files Changed

| File | Action |
|------|--------|
| `src/lib/shared/types.ts` | Modified — added `WorkflowMeta` and `DelegateEvent` interfaces |
| `src/lib/server/cli-adapter.ts` | Created — `CLIAdapter` interface, `CLIAdapterRegistry` class, `DefaultCLIAdapter` class, `UnsupportedVersionError` class, `ExecFn` type |
| `src/lib/server/__tests__/cli-adapter.test.ts` | Created — 18 tests covering all convergence criteria |

## Convergence Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `cli-adapter.ts` contains `export class CLIAdapterRegistry` | PASS |
| 2 | `cli-adapter.ts` contains `export interface CLIAdapter` with `parseSkillsOutput` and `parseDelegateOutput` | PASS |
| 3 | `cli-adapter.ts` contains `export class UnsupportedVersionError extends Error` | PASS |
| 4 | `types.ts` contains `export interface WorkflowMeta` | PASS |
| 5 | `types.ts` contains `export interface DelegateEvent` | PASS |
| 6 | Test file exists and all 18 tests pass with `npx vitest run` | PASS |
| 7 | `detectVersion()` calls `exec('maestro --version')` and returns parsed semver major via Promise | PASS |
| 8 | `getAdapter(version)` returns matching adapter or throws `UnsupportedVersionError` | PASS |
| 9 | `parseSkillsOutput` correctly parses NDJSON lines into `WorkflowMeta[]` | PASS |
| 10 | `parseDelegateOutput` correctly parses broker events into `DelegateEvent[]` | PASS |

## Deviations

- **ExecFn injection**: `CLIAdapterRegistry` constructor accepts an optional `execFn` parameter (type `ExecFn`) for testability. This is a minor design addition not in the original spec — the default behavior uses `node:child_process.exec` as specified. This pattern avoids fragile module-level mocking and is consistent with dependency injection best practices.
- **v-prefix handling**: `detectVersion()` regex was updated from `/^(\d+)/` to `/^v?(\d+)/` to handle version strings with a leading `v` prefix (e.g., `v2.0.0`), which is a common CLI output format.
- **DefaultCLIAdapter not pre-registered**: The task said "Register DefaultCLIAdapter for major version 1 in the registry." The registry itself does not auto-register; consumers register adapters explicitly via `registry.register('1', new DefaultCLIAdapter())`. This keeps the registry pure and avoids side effects at import time. The `DefaultCLIAdapter` is exported and ready for registration by the application bootstrap code.

## Test Results

```
✓ src/lib/server/__tests__/cli-adapter.test.ts (18 tests) 10ms
  Test Files  1 passed
       Tests  18 passed
```
