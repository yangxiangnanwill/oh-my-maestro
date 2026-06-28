# TASK-003: Dashboard 可视化

## Changes
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/page.tsx`: 替换占位内容为实际工作区列表。使用 `electronTrpc.workspaces.getAllGrouped.useQuery()` 获取分组工作区数据，渲染按项目分组的 WorkspaceCard 网格。支持 Loading/Empty/Error 三态渲染。点击卡片通过 `navigateToWorkspace` 导航到 workspace。

## Verification
- [x] Dashboard 页面显示从 tRPC 获取的工作区列表: 使用 `workspaces.getAllGrouped` 查询
- [x] 点击工作区卡片导航到 /workspaces/$workspaceId: 通过 `navigateToWorkspace` 工具函数
- [x] 空状态显示引导文案: EmptyState 组件显示 "还没有工作区" 提示
- [x] tsc --noEmit 零错误: 通过

## Tests
- [x] cd apps/desktop && bun run typecheck: pass (零错误)

## Deviations
- None

## Notes
- 工作区卡片使用 FolderGit2 图标，显示名称、类型和未读标记
- 按项目分组，每个项目下按 section 再分组
- 依赖 `navigateToWorkspace` 工具函数（已有 stub）
