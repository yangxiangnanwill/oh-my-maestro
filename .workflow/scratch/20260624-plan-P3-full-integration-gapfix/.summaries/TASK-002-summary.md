# TASK-002: 创建 renderer/lib/electron-trpc.ts — tRPC React 客户端

## Changes
- `apps/desktop/src/renderer/lib/electron-trpc.ts`: 创建文件，使用 `createTRPCReact<AppRouter>()` 创建类型安全的 React hooks 客户端。导入 `@trpc/react-query` 和 `lib/trpc/routers` 中的 `AppRouter` 类型，导出 `electronTrpc` 常量供 4 个 UI 面板使用。

## Verification
- [x] `grep -c "createTRPCReact"` 返回 >=1: 实际 2（import + 调用）
- [x] `grep -c "export const electronTrpc"` 返回 >=1: 实际 1
- [x] `grep -c "AppRouter"` 返回 >=1: 实际 2（import + 泛型参数）
- [x] `from 'renderer/lib/electron-trpc'` 在 renderer 中引用 >=4: 实际 4（CommandChainPanel, KnowledgePanel, AnalysisPanel, CommandPalette）

## Tests
- [x] `grep -n "electronTrpc"`: 通过 — 第4行确认导出
- [x] `grep -rn "renderer/lib/electron-trpc"`: 通过 — 4个 UI 面板均正确引用

## Deviations
- None

## Notes
- 文件仅包含最小实现（4行代码），满足所有 UI 面板的编译需求
- 未包含 Electron IPC link 函数——link 由 `ElectronTRPCProvider`（renderer/providers/）负责配置，遵循关注点分离原则
- AppRouter 类型从 `lib/trpc/routers` 导入，与 renderer 端 `types.ts` 文件使用的路径别名模式一致
