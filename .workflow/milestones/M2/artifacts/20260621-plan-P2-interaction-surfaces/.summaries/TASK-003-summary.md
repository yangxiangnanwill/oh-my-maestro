# TASK-003 Summary: DialogManager — Claude Code CLI + NDJSON Streaming + Intent Routing

## Status: ✅ COMPLETED

## Files Modified/Created
- `src/lib/server/dialog-manager.ts` — 新建 (280 行): DialogManager 类，Claude Code CLI 子进程管理、NDJSON 流解析、意图识别路由
- `src/lib/server/__tests__/dialog-manager.test.ts` — 新建 (373 行): 21 个测试用例
- `src/lib/shared/types.ts` — 修改 (+20 行): 新增 StreamChunk、IntentResult、IntentCandidate 类型

## Convergence Criteria Verification
- [x] `export class DialogManager` — ✅ dialog-manager.ts:26
- [x] 构造函数接受 `(eventBus, spawnFn?, workflowRegistry?)` — ✅ dialog-manager.ts:37-41
- [x] `createSession(clientId)` 返回 DialogSession — ✅ dialog-manager.ts:50-73
- [x] `createSession` 第6次抛 Error — ✅ dialog-manager.ts:51-53
- [x] `sendMessage` 启动 CLI + 写入 stdin — ✅ dialog-manager.ts:82-97
- [x] `spawnClaudeCLI` 调用 `spawnFn('claude', ['--output-format', 'stream-json', '--verbose'])` — ✅ dialog-manager.ts:109-113
- [x] `parseChunk` 解析 NDJSON，无效行返回 null — ✅ dialog-manager.ts:153-176
- [x] `STREAM_CHUNK` 事件发布 — ✅ dialog-manager.ts:181-188
- [x] `detectIntent` 返回 IntentResult — ✅ dialog-manager.ts:202-244
- [x] confidence >= 0.8 直接路由 — ✅ dialog-manager.ts:252-262
- [x] confidence 0.5-0.8 歧义列表 — ✅ dialog-manager.ts:263-273
- [x] `closeSession` kill + delete + emit — ✅ dialog-manager.ts:280-294
- [x] `updateWorkflowRegistry` 更新注册表 — ✅ dialog-manager.ts:300-302
- [x] 测试文件存在且全部通过 — ✅ 21 tests passed

## Test Results
- DialogManager: 21/21 passing
- Full suite: 104/104 passing (7 test files)
- No regressions

## Key Decisions
1. 复用 DelegateExecutor 的 spawn/parseLine/emitEvent 三阶段模式
2. 流安全解析 — parseChunk() 对无效行返回 null
3. 意图识别阈值: >= 0.8 直接路由, 0.5-0.8 歧义列表, < 0.5 不触发
4. 5 会话上限 — createSession() 在达到 MAX_SESSIONS=5 时抛出明确错误

## Deviations
None — 完全按照计划执行
