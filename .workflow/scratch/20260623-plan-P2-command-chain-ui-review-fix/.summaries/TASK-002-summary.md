# TASK-002: 修复 CommandChainPanel 类型安全 + error 处理 + 架构对齐

## Changes
- `CommandChainPanel.tsx`: 删除 `as CommandChainStatus` 断言行和 `CommandChainStatus` 类型导入（tRPC 已推断类型）；将 `error.message` 替换为 `error instanceof Error ? error.message : '未知错误'` 类型守卫；移除 `refetchInterval: 2000`；所有 `typedStatus` 引用替换为直接使用 `status`
- `types.ts`: 删除 `Step` 接口中的 `durationMs?: number` 字段及注释
- `StepItem.tsx`: 移除 `computeDuration` 函数中的 `step.durationMs` 检查分支，仅保留 `startedAt/completedAt` 计算逻辑
- `CommandChainPanel.test.tsx`: 将 `error.message` 断言更新为 `error instanceof Error`

## Verification
- [x] `grep -r 'as CommandChainStatus' CommandChainPanel.tsx` 返回空
- [x] `grep -r 'instanceof Error' CommandChainPanel.tsx` 返回匹配（第58行）
- [x] `grep -r 'refetchInterval' CommandChainPanel.tsx` 返回空
- [x] `grep -r 'durationMs' types.ts` 返回空
- [x] `grep -r 'error\.message' CommandChainPanel.tsx` 仅在类型守卫内部（`error instanceof Error ? error.message`），是安全的

## Tests
- [x] `bun test src/renderer/components/CommandChainPanel/CommandChainPanel.test.tsx`: **8 pass, 0 fail**

## Deviations
- `index.ts` 无需修改：它只重导出类型名称（CommandChainPanelProps, CommandChainStatus, DecisionNode, Step, StepStatus），不涉及 `durationMs` 字段
- `CommandChainStatus` 类型保留在本地 `types.ts` 中（不从 tRPC router 重导出），因为 tRPC 的 `useQuery` 已自动推断返回类型为 `CommandChainStatusOutput | null | undefined`，删除 `as` 断言后不再需要显式类型注释
- 测试文件存在外部修改（引入了 `../../test-utils/source-analysis` 的 import，替换了原来的内联 `extractFunctionSource`），已在本次任务中同步更新了断言

## Notes
- TASK-001 的 tRPC router 使用 `.output(commandChainStatusSchema.nullable())`，所以 `useQuery` 返回的 `data` 类型为 `CommandChainStatusOutput | null | undefined`
- 移除 `refetchInterval` 后，前端依赖 tRPC 默认的 staleTime + refetchOnWindowFocus 行为
