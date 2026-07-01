# TASK-004: store.ts 6 个未使用函数参数加下划线前缀

## Changes
- `apps/desktop/src/renderer/stores/tabs/store.ts`: 4 个 stub 函数未使用参数加 `_` 前缀
  - `addChatTab(workspaceId, options)` → `addChatTab(workspaceId, _options)`（workspaceId 在 set 内使用，保留）
  - `addChatPane(tabId, options)` → `addChatPane(tabId, _options)`（tabId 在 set 内使用，保留）
  - `switchChatSession(paneId, sessionId)` → `switchChatSession(_paneId, _sessionId)`
  - `setChatLaunchConfig(paneId, config)` → `setChatLaunchConfig(_paneId, _config)`

## Verification
- [x] grep `_options|_paneId|_sessionId|_config` 命中 4 处（line 129/137/145/149）
- [x] `bunx biome lint src/renderer/stores/tabs/store.ts` exit 0（No fixes applied）
- [x] `bun run typecheck` exit 0（tsc --noEmit 无错误）

## Tests
- [x] biome lint: pass（exit 0，Checked 1 file in 12ms. No fixes applied.）
- [x] typecheck: pass（exit 0）

## Deviations
- None

## Notes
- 与文件内已有 `_organizationId`/`_opts` 风格一致，保持 store 接口签名形状不变。
- workspaceId/tabId 因在 set 回调内被使用，不加前缀（否则反触发 noUnusedFunctionParameters 之外的逻辑错误）。
- ISS-20260630-014 修复完成，无 commit（按要求不自动 commit）。
