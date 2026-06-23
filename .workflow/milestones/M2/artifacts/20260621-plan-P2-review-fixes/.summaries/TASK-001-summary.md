# TASK-001: 修复终端事件契约：添加 CREATE/DESTROY 常量 + ws-gateway 事件转发 + TerminalManager 订阅

## Changes
- `src/lib/shared/events.ts`: 在 TerminalEvents 中添加 `CREATE: 'term:create'` 和 `DESTROY: 'term:destroy'` 常量
- `src/lib/server/terminal-manager.ts`: 在构造器中添加 `TerminalEvents.CREATE` 和 `TerminalEvents.DESTROY` 订阅，CREATE 订阅自动生成 terminalId（因为客户端 payload 为空对象）
- `src/lib/client/components/TerminalBridge.svelte`: 第 118 行 `'term:create'` 替换为 `TerminalEvents.CREATE`，第 136 行 `'term:destroy'` 替换为 `TerminalEvents.DESTROY`

## Verification
- [x] grep "CREATE.*term:create" events.ts: 匹配第 44 行
- [x] grep "DESTROY.*term:destroy" events.ts: 匹配第 45 行
- [x] grep "TerminalEvents.CREATE" terminal-manager.ts: 匹配第 67 行（构造器订阅）
- [x] grep "TerminalEvents.DESTROY" terminal-manager.ts: 匹配第 74 行（构造器订阅）
- [x] grep "TerminalEvents.CREATE" TerminalBridge.svelte: 匹配第 118 行（替换硬编码字符串）
- [x] grep "TerminalEvents.DESTROY" TerminalBridge.svelte: 匹配第 136 行（替换硬编码字符串）
- [x] grep "'term:create'" TerminalBridge.svelte: 无匹配（硬编码字符串已消除）
- [x] grep "'term:destroy'" TerminalBridge.svelte: 无匹配（硬编码字符串已消除）
- [x] npx vitest run terminal-manager.test.ts: 25 tests 全部通过

## Tests
- [x] npx vitest run src/lib/server/__tests__/terminal-manager.test.ts: 25 passed
- [x] npx tsc --noEmit: 修改文件无类型错误（预先存在的 stores/index.ts StepStatus 错误与本次修改无关）

## Deviations
- tsc --noEmit 有 1 个预先存在的类型错误（stores/index.ts:137 Cannot find name 'StepStatus'），与本次修改无关，非本次任务引入

## Notes
- CREATE 订阅中自动生成 terminalId 格式为 `term-{timestamp}-{random}`，因为 TerminalBridge.svelte 发送 CREATE 时 payload 为空对象
- 存储的 3 个语义不同的 TerminalEvent：CREATE（客户端请求创建）、CREATED（PTY 创建成功后发布）、DESTROY（客户端请求销毁）
- 无需修改 ws-gateway.ts，其 default 分支会将 term:create/term:destroy 转发到 EventBus
