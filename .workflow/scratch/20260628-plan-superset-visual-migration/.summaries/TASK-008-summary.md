# TASK-008: Knowledge Panel + 收尾

## Changes
- `apps/desktop/src/renderer/routes/_authenticated/workspaces/$workspaceId/-layout.tsx`: 在 Workspace Tab bar 右侧添加 Search 切换按钮。点击切换 KnowledgePanel 显示/隐藏（320px 右侧面板）。保持 Tab bar 的 Overview/Chat/Terminal 标签结构。

## Verification
- [x] Workspace 页面 Tab bar 显示 Knowledge 按钮: Search 图标按钮在 Tab bar 右侧
- [x] 点击按钮显示 KnowledgePanel: 320px 宽度面板滑入
- [x] 再次点击隐藏面板: toggle 逻辑
- [x] Dashboard 和 Workspace 均包含 KnowledgePanel 入口: Dashboard 右侧面板 + Workspace Tab bar
- [x] tsc --noEmit 零错误: 通过

## Tests
- [x] cd apps/desktop && bun run typecheck: pass (零错误)

## Deviations
- KnowledgePanel 的 cwd 传空字符串，因为当前没有实际工作目录上下文
- Workspace 的 Chat tab 目前仍是占位状态（完整 ChatInterface 依赖过多），但 Chat 面板通过 Split View 中的 ChatPanel 可用

## Notes
- KnowledgePanel 在 Dashboard 和 Workspace 两处都可访问
- Dashboard 中通过右侧面板切换按钮访问
- Workspace 中通过 Tab bar 右侧 Search 按钮访问
- 点击 Knowledge 按钮时按钮高亮显示 accent 背景色
