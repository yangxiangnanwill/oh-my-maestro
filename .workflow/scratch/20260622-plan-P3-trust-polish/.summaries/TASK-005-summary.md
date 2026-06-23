# TASK-005: P1 性能优化 + 翻译增强

## Changes
- `src/lib/server/terminal-manager.ts`: ActiveTerminal 接口添加 `_throttleActive: boolean` 和 `_idleTicks: number` 字段；startFrameThrottle() 改为动态启停 — 数据到达时启动 timer，连续 3 个空闲 tick（约 100ms）后停止；pty.onData 回调中检查 `!_throttleActive` 时重新启动；修复 `checkMaxSessions('terminal')` 传递 label 参数以匹配 SessionManager 基类期望
- `src/lib/server/ws-gateway.ts`: broadcastEvent() 中预计算 `JSON.stringify(baseMessage)` 存入 `preSerialized` 变量，循环内对非翻译事件直接使用预序列化字符串；新增 `sendRawToClient()` 方法处理预序列化消息发送（含 backpressure 检查）
- `src/lib/client/stores/index.ts`: 移除 500ms setInterval 轮询（原第 23-35 行），改为调用 `wsClient.onStateChange()` 事件驱动回调
- `src/lib/client/services/ws-client.ts`: 新增 `WSClientState` 接口和 `StateChangeCallback` 类型；添加 `stateCallbacks` Set 和 `onStateChange()` 方法（返回 unsubscribe 函数）；在 `onopen`、`onclose`、`onerror`、RECONNECT 处理中调用 `notifyStateChange()`
- `src/lib/server/translator.ts`: isDialogPayload() 收紧判断 — 从仅检查 `sessionId` 改为：必须同时满足 sessionId + (StreamChunk type 字段 或 workflowId/confidence 字段 或 clientId+session 字段 或 status='closed')，防止 Gate payload 被错误跳过翻译
- `src/lib/shared/translations.ts`: translateString() 修复复合词边界 — 正则从 `\b` 改为 `(?<![a-zA-Z-])term(?![a-zA-Z-])`，防止 'delegate-executor' 中的 'delegate' 被误替换；新增 `escapeRegex()` 辅助函数
- `src/lib/shared/__tests__/translator.test.ts`: 新增 4 个测试 — 复合词边界不替换（delegate-executor）、独立词仍替换、复合词不替换子串（my-command-tool/my-execution-tool）、术语泄漏检测（maestro 不出现在翻译输出中）

## Verification
- [x] grep -r '_throttleActive' src/lib/server/terminal-manager.ts 返回至少 3 行: 5 行（字段定义、初始化、条件检查、设为 true、设为 false）
- [x] grep -r '_idleTicks' src/lib/server/terminal-manager.ts 返回至少 2 行: 6 行（字段定义、初始化、重置 x2、递增、阈值判断）
- [x] grep -r 'JSON.stringify' src/lib/server/ws-gateway.ts 返回 broadcastEvent() 中只有 1 次 stringify 调用: preSerialized 在循环前调用 1 次，sendToClient 中 1 次（仅用于翻译事件）
- [x] grep -r 'setInterval' src/lib/client/stores/index.ts 返回 0 行: 0 行（轮询已移除）
- [x] grep -r 'onStateChange' src/lib/client/stores/index.ts 返回至少 1 行: 1 行（第 23 行 wsClient.onStateChange 调用）
- [x] grep -r "payload.type === 'text'" src/lib/server/translator.ts 返回 isDialogPayload() 中的类型检查: validChunkTypes Set 包含 'text'，typeof payload.type === 'string' 检查
- [x] npx vitest run src/lib/shared/__tests__/translator.test.ts 全部通过: 16/16 通过，包含复合词边界测试和术语泄漏检测
- [x] npx vitest run src/lib/shared/__tests__/translator.test.ts 术语泄漏检测: 'maestro' 在 translated 输出中返回 0 行

## Tests
- [x] `npx vitest run src/lib/server/__tests__/terminal-manager.test.ts`: 26/26 通过
- [x] `npx vitest run src/lib/server/__tests__/ws-gateway.test.ts`: 17/17 通过
- [x] `npx vitest run src/lib/shared/__tests__/translator.test.ts`: 16/16 通过
- [x] `npx tsc --noEmit`: 编译通过，零类型错误

## Deviations
- terminal-manager.ts 中 `checkMaxSessions()` 缺少 `'terminal'` label 参数导致测试失败 — 这是 TASK-004 (SessionManager 基类提取) 的遗留问题，已在本任务中修复（添加 `'terminal'` 参数）
- 复合词边界测试中 `command-chain` 和 `execution-session` 是已注册的翻译别名，不能用作"不应替换"的测试数据 — 改用 `my-command-tool` 和 `my-execution-tool` 等非注册复合词

## Notes
- throttle 动态启停在频繁启停场景中通过 `_idleTicks >= 3`（约 100ms）阈值防止抖动
- WSClient.onStateChange 在 setMode() 中也触发回调，确保 mode 变更立即同步到 store
- isDialogPayload 收紧后，Gate payload（gateId 字段）不再被错误识别为 Dialog payload
- 复合词边界正则 `(?<![a-zA-Z-])` 同时排除字母和连字符，确保 `delegate-executor` 整体不被拆分翻译
