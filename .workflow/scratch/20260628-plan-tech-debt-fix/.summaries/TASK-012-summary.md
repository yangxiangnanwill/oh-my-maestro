# TASK-012: 提取 TipTapExtensions 共享类型

## 变更
- 新建 `src/renderer/lib/tiptap-utils.ts`: 导出 TipTapExtensions 类型 (MAINT-001)
- `MarkdownEditor.tsx`: 使用 TipTapExtensions 替代内联条件类型
- `TipTapMarkdownRenderer.tsx`: 使用 TipTapExtensions 替代内联条件类型

## 验证
- [x] `bun run typecheck` exit 0
- [x] 两处重复的类型断言已统一为共享类型
- [x] 类型语义正确
