# TASK-007: AnalysisPanel ErrorState 添加重试按钮

## Changes
- `apps/desktop/src/renderer/components/AnalysisPanel/AnalysisPanel.tsx`: ErrorState 添加 `onRetry` prop 和重试按钮；AnalysisPanel 从 useQuery 解构 `refetch` 并传递给 ErrorState

## Verification
- [x] grep -c "onRetry" 返回 >=2（5 次：prop 定义 3 处 + 调用处传参 1 处）：通过
- [x] grep -c "refetch" 返回 >=2（2 次：解构获取 1 次 + 传递给 onRetry 1 次）：通过
- [x] grep -c "重试" 返回 >=1（1 次：按钮文本）：通过
- [x] ErrorState 的 button 元素包含 onClick={onRetry} 处理：通过（第 57 行）

## Tests
- [x] `grep -n "onRetry" AnalysisPanel.tsx`: 通过（43, 46, 53, 57, 183 行）
- [x] `grep -n "refetch" AnalysisPanel.tsx`: 通过（160, 183 行）

## Deviations
- None

## Notes
- 样式和模式完全参考 KnowledgePanel.tsx:77-99 的 ErrorState 重试模式
- 按钮样式：`mt-2 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90`
