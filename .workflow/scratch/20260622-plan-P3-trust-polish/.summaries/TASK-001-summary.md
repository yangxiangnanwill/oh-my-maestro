# TASK-001: GateManager 审批门控模块

## Changes
- `src/lib/server/gate-manager.ts`: 新建 — GateManager 类，包含 5 状态状态机（pending→presented→approved/rejected/expired）、EventBus 集成、30s 超时自动拒绝、createGate/resolveGate/getGate/clearGate/clearAll/buildDryRunPrompt/performDryRun 方法
- `src/lib/server/delegate-executor.ts`: 修改 — execute() 增加第三个参数 mode: 'write' | 'analysis' = 'write'；新增 executeDryRun(prompt, tool) 方法，spawn --mode analysis 并收集完整 stdout 字符串
- `src/lib/server/index.ts`: 修改 — 导入 GateManager；构造函数中实例化 gateManager；POST /api/workflows/execute 改为先 performDryRun 再 createGate，返回 { executionId, gateId, status: 'pending' }；新增 POST /api/gates/:id/resolve 路由，接收 { approved: boolean }，approved=true 时执行 delegateExecutor.execute()
- `src/lib/client/components/WorkflowCommander.svelte`: 修改 — 导入 wsClient、ApprovalGate 类型、Channels/GateEvents 常量、ApprovalPanel 组件；executeWorkflow() 改为 async 门控流程：POST execute → 展示 ApprovalPanel → 监听 gate:resolved → 用户确认后 POST resolve；新增 handleApprove/handleReject/handleDismiss 回调；模板中条件渲染 ApprovalPanel
- `src/lib/server/__tests__/gate-manager.test.ts`: 新建 — 22 个测试覆盖 createGate 发布 gate:pending、resolveGate 发布 gate:resolved、30s 超时自动 expired、状态转换正确性、getGate/clearGate/clearAll、buildDryRunPrompt 参数过滤、performDryRun 委托调用

## Verification
- [x] grep -r 'class GateManager' src/lib/server/gate-manager.ts 返回类定义，包含 createGate 和 resolveGate 方法: 通过
- [x] grep -r 'executeDryRun' src/lib/server/delegate-executor.ts 返回方法定义，包含 --mode analysis 参数: 通过
- [x] grep -r 'gateManager.createGate' src/lib/server/index.ts 返回调用点，位于 POST /api/workflows/execute 路由内: 通过
- [x] grep -r 'gate:pending' src/lib/server/gate-manager.ts 返回 EventBus.publish 调用，发布到 Channels.GATE: 通过
- [x] grep -r 'POST.*gates.*resolve' src/lib/server/index.ts 返回新路由定义，接收 approved 参数: 通过
- [x] grep -r 'ApprovalPanel' src/lib/client/components/WorkflowCommander.svelte 返回组件导入和使用: 通过
- [x] npx vitest run src/lib/server/__tests__/gate-manager.test.ts 全部通过: 22/22 通过

## Tests
- [x] npx vitest run src/lib/server/__tests__/gate-manager.test.ts: 22 tests passed (24ms)
- [x] npx vitest run src/lib/server/__tests__/delegate-executor.test.ts: 22 tests passed, no regressions (22ms)
- [x] npx tsc --noEmit: 零错误

## Deviations
- None

## Notes
- ApprovalPanel.svelte 已存在且 props 接口完全匹配（gate: ApprovalGate, onApprove, onReject, onDismiss），无需修改
- wsClient 从 $lib/client/stores/index.js 导入（与现有 stores 模式一致），而非直接从 services/ws-client.js 导入
- GateManager 在构造函数中接收 DelegateExecutor 实例，performDryRun 委托给 delegateExecutor.executeDryRun()
- Dry-run 失败不阻断流程（catch 后 dryRunResult 为空字符串），门控仍正常创建
- 移除了 WorkflowCommander 中未使用的 displayMode 和 ExecutionStep 导入
