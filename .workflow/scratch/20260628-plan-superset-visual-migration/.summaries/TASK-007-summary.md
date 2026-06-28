# TASK-007: CommandChain 集成

## Changes
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/-layout.tsx`: 在 Dashboard 布局中添加 RightSidePanel 组件。右侧面板包含两个切换按钮（CommandChain + Knowledge），点击互斥切换。集成 `CommandChainPanel` 和 `KnowledgePanel` 组件。

## Verification
- [x] Dashboard 右侧显示面板切换按钮: ListChecks 和 Search 图标按钮
- [x] 点击 CommandChain 按钮显示 CommandChainPanel: 320px 宽度面板
- [x] 点击 Knowledge 按钮显示 KnowledgePanel: 320px 宽度面板
- [x] 再次点击关闭面板: 互斥切换逻辑
- [x] tsc --noEmit 零错误: 通过

## Tests
- [x] cd apps/desktop && bun run typecheck: pass (零错误)

## Deviations
- CommandChainPanel 的 cwd 传空字符串，因为 Dashboard 页面没有当前工作目录上下文
- KnowledgePanel 的 cwd 同样传空字符串

## Notes
- 面板切换使用 `useState<RightPanel>("none")` 管理状态
- 按钮高亮使用 accent 背景色表示激活状态
- 面板宽度固定 320px，与 shadcn/ui 侧边栏宽度一致
- 两个面板互斥：打开一个会自动关闭另一个
