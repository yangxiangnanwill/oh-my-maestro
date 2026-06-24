# TASK-006: DecisionNodeView 交互按钮 — 待决策节点选项可点击

## Changes
- `apps/desktop/src/renderer/components/CommandChainPanel/DecisionNodeView.tsx`: 添加 `onSelectOption` prop，未决策节点（`!node.resolved`）选项渲染为 `<button>` 元素，带 hover/focus/cursor-pointer 样式，点击触发 `onSelectOption(node.id, option)`；已决策节点保持只读 `<li>` 展示
- `apps/desktop/src/renderer/components/CommandChainPanel/CommandChainPanel.tsx`: 添加 `useCallback` import，新增 `handleDecisionSelect` 回调函数（当前使用 console.log fallback，预留 tRPC mutation 注释），将 `onSelectOption={handleDecisionSelect}` 传给 `DecisionNodeView`

## Verification
- [x] `grep -c "onSelectOption" DecisionNodeView.tsx` 返回 3（prop 定义 + 解构 + 调用）: 通过
- [x] `grep -c "<button" DecisionNodeView.tsx` 返回 1（选项渲染为 button 元素）: 通过
- [x] `grep -c "onClick" DecisionNodeView.tsx` 返回 1（点击事件绑定）: 通过
- [x] `grep -c "cursor-pointer\|hover:" DecisionNodeView.tsx` 返回 2（视觉反馈）: 通过
- [x] 已决策节点（resolved=true）的选项不触发 onClick：代码逻辑中 `if (node.resolved)` 分支渲染只读 `<li>`，不包含 button/onClick

## Tests
- [x] `grep -n "onSelectOption" DecisionNodeView.tsx`: 通过 — 第 6/9/66 行
- [x] `grep -n "<button" DecisionNodeView.tsx`: 通过 — 第 64 行
- [x] `grep -n "handleDecisionSelect\|resolveDecision" CommandChainPanel.tsx`: 通过 — 第 47/52/53/103 行

## Deviations
- 无。严格遵循 implementation 步骤顺序执行。

## Notes
- `handleDecisionSelect` 当前使用 `console.log` fallback，因为 command-chain tRPC router 尚未提供 `resolveDecision` mutation。代码中已预留 TODO 注释，当 router 添加该 endpoint 后可替换为 `electronTrpc.commandChain.resolveDecision.useMutation().mutate()`
- 所有样式遵循现有 Tailwind 类名约定（`bg-purple-100`, `dark:bg-purple-900/20` 等），与组件现有设计一致
- 使用 `<button type="button">` 确保键盘可访问性（Tab 导航 + Enter 触发）
