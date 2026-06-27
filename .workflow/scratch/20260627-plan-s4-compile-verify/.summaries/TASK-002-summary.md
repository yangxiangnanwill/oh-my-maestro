# TASK-002: 扩展 shadcn/ui stub props

## Changes
- `src/renderer/components/Chat/stubs/ui/ai-elements/plan.tsx`: 添加 PlanHeader, PlanTitle, PlanDescription, PlanContent 四个缺失的导出组件
- `src/renderer/components/Chat/stubs/ui/ai-elements/message.tsx`: 添加 TOOL_CALL_MD_CLASSNAME 常量导出
- `src/renderer/components/Chat/stubs/ui/ai-elements/model-selector.tsx`: 添加 ModelSelectorName 组件导出

## Verification
- [x] `tsc --noEmit` TS2322 输出 < 76（从 126 减少至少 50）: 当前 13 个 TS2322，远低于 76
- [x] 所有 stub 组件接受 asChild, sideOffset, align, onOpenChange, onPointerDownOutside 等消费者传递的 props: 已验证 dialog, popover, dropdown-menu, tooltip, command, select, hover-card, collapsible, context-menu 等文件均已包含完整 props
- [x] PopoverContent, DialogContent, DropdownMenuContent 等浮层组件接受 sideOffset 和 alignOffset 数值 props: 已验证

## Tests
- [x] `bun run typecheck`: TS2322 从之前已解决的 25 降至 13（部分被其他并行任务修复）；stub 相关的 TS2305/TS2724 导出错误全部消除

## Deviations
- 原任务描述的目标 TS2322 从 126 降至 76 以下，实际在任务执行前已降至 25（由 TASK-001 或并行任务完成）
- 本次额外修复了 3 个 TS2305/TS2724 缺失导出错误（plan.tsx, message.tsx, model-selector.tsx），这些错误直接与 stub 文件不完整有关
- 仍有 10 个 TS2307 模块路径错误（MarkdownEditor/MarkdownRenderer 中使用错误相对路径），但不属于 TS2322 范畴，不在本任务范围内

## Notes
- 剩余的 13 个 TS2322 错误均在 stubs/ 目录之外，涉及类型不匹配（LucideProps vs ComponentType、WebSearchResultItem vs WebSearchResult 等），需要其他任务处理
