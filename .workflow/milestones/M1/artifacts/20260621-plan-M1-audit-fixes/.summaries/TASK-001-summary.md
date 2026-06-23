# TASK-001: 修复 CRITICAL 运行时阻断：缺少依赖 + DelegateEvent→WorkflowExecution 数据契约不匹配

## Changes
- `package.json`: 在 dependencies 中添加 `"@hono/node-server": "^1.13.0"`（按字母顺序插入 hono 之前）
- `package-lock.json`: npm install 自动更新
- `src/lib/client/stores/index.ts`: 添加 `executionMap`（Map<string, WorkflowExecution>），重构 `wsClient.on(Channels.WORKFLOW, ...)` 处理器以正确将 DelegateEvent 累积为 WorkflowExecution

## Verification
- [x] package.json dependencies 包含 "@hono/node-server": "^1.13.0": grep 确认第19行
- [x] src/lib/client/stores/index.ts 包含类型为 Map<string, WorkflowExecution> 的 executionMap: grep 确认第52行
- [x] src/lib/client/stores/index.ts 的 workflow:step-update 处理器从 message.payload 中提取 DelegateEvent 字段（type, executionId, stepIndex, stepName, output, timestamp）而非将其视为 WorkflowExecution: grep 确认第75行解构
- [x] src/lib/client/stores/index.ts 中对 executionMap 的更新操作使用 executionMap.get(executionId) 和 executionMap.set(executionId, updatedExecution): grep 确认第78行和第130行
- [x] npm install 成功完成且无错误: 退出码0，新增1个包

## Tests
- [x] npm install 2>&1: pass — 成功添加 @hono/node-server，退出码0
- [x] npx tsc --noEmit 2>&1 | head -50: pass — stores/index.ts 无类型错误（4个预存错误在其他文件中，不在本任务范围内）
- [x] node -e require.resolve('@hono/node-server'): pass — 包可正常解析

## Deviations
- 在实现中增加了 `existingIdx` 检查（第121-126行），当同一 stepIndex 已存在时更新而非重复推入。这超出了原计划的范围，但防止了重复步骤的问题。
- 终端状态保护（第92行）同时检查了 `cancelled` 状态，虽然 DelegateEvent 的 type 联合类型中未包含 cancelled，但 WorkflowStatus 类型包含它，增加了防御性。

## Notes
- 所有4个 TypeScript 错误均为预存错误（delegate-executor.ts 的 TS2783，state-sync.ts 的 TS2503/TS7006），不在本任务范围内。
- executionMap 没有清理逻辑，如 rationale 中所述，M1 MVP 范围内单次执行数量有限，暂不引入。
- 下一个任务可以安全引用 activeWorkflows store，其内容现在将是正确填充的 WorkflowExecution 对象。
