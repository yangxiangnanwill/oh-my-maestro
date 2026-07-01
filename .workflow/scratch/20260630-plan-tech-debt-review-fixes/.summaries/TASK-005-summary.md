# TASK-005: tabs/store: replace module-level mutable counters with crypto.randomUUID()

## Changes
- `apps/desktop/src/renderer/stores/tabs/store.ts`: Deleted module-level mutable counters `let tabCounter = 0;` and `let paneCounter = 0;`. Rewrote `nextTabId()` and `nextPaneId()` to return `crypto.randomUUID()`. Replaced the 2-line Phase-4 comment block with a single line: `// IDs generated via crypto.randomUUID() — no module-level mutable counters (HMR-safe).`

## Verification
- [x] grep `crypto.randomUUID` returns at least 2 matches: 3 matches (comment + nextTabId + nextPaneId) — verified
- [x] ! grep `tabCounter` returns no matches: 0 matches — verified
- [x] ! grep `paneCounter` returns no matches: 0 matches — verified
- [x] ! grep `let tabCounter = 0\|let paneCounter = 0` returns no matches: covered by the zero-match result above — verified
- [x] `cd apps/desktop && bun run typecheck` exits 0: `tsc --noEmit` ran clean, exit 0 — verified

## Tests
- [x] `cd apps/desktop && bun run typecheck`: pass (no errors)
- [x] `grep -rn 'tabCounter\|paneCounter' apps/desktop/src/renderer/stores/tabs/store.ts`: pass (no matches)

## Deviations
- None. Implementation matches the task `action` exactly: `nextTabId`/`nextPaneId` return `crypto.randomUUID()` (no `tab-`/`pane-` prefix), per the task's `files[].change` field.

## Notes
- Safety pre-check: grepped `src/` for `startsWith('tab-')` / `startsWith('pane-')` / `split('tab-')` / `tab-${` / `pane-${` format-parsing dependencies. Only matches were the store.ts generators themselves and `page.tsx:190` (`tabId: \`tab-${workspaceId}\``), which is a separate workspaceId-derived ID — no code parses the counter-based ID format, so dropping the prefix is safe.
- `crypto.randomUUID` is globally available in Electron renderer (secure context, typed in lib.dom.d.ts) — no import added.
- No git commit performed (per task instructions: 不自动 git commit).
- ISS-20260630-008 fix complete; ready for commit by orchestrator with message `TASK-005: tabs/store replace module-level mutable counters with crypto.randomUUID() [ISS-20260630-008]`.
