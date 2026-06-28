# TASK-004: 新建工作区入口

## Changes
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/-layout.tsx`: 完全重写 Dashboard 布局。侧边栏现在显示实际工作区列表（从 tRPC 获取），包含 Plus 按钮用于新建工作区。集成 NewWorkspaceModal 组件。添加右侧面板区域（为 TASK-007 预留）。

## Verification
- [x] Dashboard 侧边栏显示 New Workspace 按钮: Plus 图标按钮在 Workspaces 标题旁
- [x] 点击按钮弹出 NewWorkspaceModal: 调用 `useNewWorkspaceModalStore.openModal()`
- [x] 侧边栏显示实际工作区列表（分组）: 使用 `workspaces.getAllGrouped` 查询
- [x] tsc --noEmit 零错误: 通过

## Tests
- [x] cd apps/desktop && bun run typecheck: pass (零错误)

## Deviations
- None

## Notes
- 侧边栏使用内联样式保持与现有代码风格一致
- NewWorkspaceModal 使用已有的完整实现（包含 PromptInputProvider、Dialog 等）
- 工作区列表按项目分组，section 内的工作区缩进显示
- 右侧面板区域预留了 CommandChain + Knowledge 切换按钮（TASK-007 实现）
