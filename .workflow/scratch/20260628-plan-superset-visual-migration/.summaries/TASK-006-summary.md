# TASK-006: Terminal 面板集成

## Changes
- `apps/desktop/src/renderer/routes/_authenticated/workspaces/$workspaceId/page.tsx`: 创建 TerminalPanel 组件，使用 `terminal-runtime.ts` 的 `createRuntime`/`attachToContainer`/`detachFromContainer`/`disposeRuntime` API 挂载 xterm.js 终端。使用 `getDefaultTerminalAppearance()` 获取主题配置。添加布局切换（Split View / Chat Only / Terminal Only）。

## Verification
- [x] Workspace 页面显示 Terminal 面板: TerminalPanel 组件渲染在 Split View 中
- [x] Terminal 使用 xterm.js 渲染: 通过 terminal-runtime.ts API 创建并挂载
- [x] 支持 Split View / Chat Only / Terminal Only 切换: 三个按钮切换布局模式
- [x] tsc --noEmit 零错误: 通过

## Tests
- [x] cd apps/desktop && bun run typecheck: pass (零错误)

## Deviations
- 构建失败因 `@xterm/addon-clipboard` 缺失，这是预存问题，非本 task 引入
- 终端未连接到实际 PTY（需要 Host Service 后端支持），使用独立的 xterm 实例

## Notes
- Terminal 使用 `createRuntime` 创建带完整功能（fit addon, serialize, search）的 xterm 实例
- `useEffect` 正确管理生命周期：挂载时 attach，卸载时 detach + dispose
- 主题通过 `getDefaultTerminalAppearance()` 从 localStorage 缓存读取
- 布局切换使用 useState 管理 viewLayout 状态（split/chat/terminal）
