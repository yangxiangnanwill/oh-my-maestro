# TASK-005: 补充 index.full.ts 和 -layout.tsx 缺失的依赖文件

## Changes
- **无需修改** — 全部 6 个文件已存在并实现完整

## 文件状态

### 主进程文件（已存在，完整实现）
- `src/main/lib/app-state/index.ts` — 导出 `initAppState(): Promise<void>` + `appState` proxy
- `src/main/lib/extensions/index.ts` — 导出 `loadWebviewBrowserExtension(): Promise<void>` + `loadReactDevToolsExtension()`
- `src/main/lib/terminal/index.ts` — 导出 `prewarmTerminalRuntime()`, `reconcileDaemonSessions()`, `restartDaemon()` 等

### 渲染进程文件（已存在，完整实现）
- `src/renderer/components/ThemedToaster/ThemedToaster.tsx` — 完整 React 组件，有 `index.ts` barrel export
- `src/renderer/providers/AuthProvider/AuthProvider.tsx` — 完整 auth context provider，有 `index.ts` barrel export
- `src/renderer/providers/ElectronTRPCProvider/ElectronTRPCProvider.tsx` — 完整 tRPC + React Query persist provider，有 `index.ts` barrel export

## 验证

- [x] `tsc --noEmit` 不报告 app-state.ts, extensions.ts, terminal.ts, ThemedToaster.tsx, AuthProvider.tsx, ElectronTRPCProvider.tsx 的 TS2307 错误
  - 验证方式：运行 `bun run typecheck`，对目标文件 grep TS2307，结果为空
- [x] `index.full.ts` 中 `./lib/app-state`, `./lib/extensions`, `./lib/terminal` 导入解析成功
  - 验证方式：所有目标模块的 `index.ts` barrel export 均存在且导出正确的函数
- [x] `-layout.tsx` 中 `ThemedToaster`, `AuthProvider`, `ElectronTRPCProvider` 导入解析成功
  - 验证方式：所有目标组件的 `index.ts` barrel export 均存在且导出正确的组件

## 说明

- 全部 6 个文件在之前的开发迭代中已经创建并完整实现，本任务无需新增代码
- `index.full.ts` 和 `-layout.tsx` 虽然被 `tsconfig.json` 排除编译（exclude），但它们的 import 路径均有对应的模块文件
- 主进程文件使用目录结构（`app-state/index.ts` 等）而非单文件，符合项目规范（"one folder per component"）
- 渲染进程文件均使用 `index.ts` barrel export 模式，从 `-layout.tsx` 的 flat import 路径正确解析

## 偏差
- 无
