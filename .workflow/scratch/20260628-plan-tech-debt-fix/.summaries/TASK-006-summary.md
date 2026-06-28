# TASK-006: MarkdownEditor html:true→false + BP-004 注释

## 变更
- `MarkdownEditor.tsx`: html: true → false，添加 Phase 4 DOMPurify 集成注释 (SEC-001)
- 与只读渲染器 createMarkdownExtensions.ts 的安全策略保持一致

## 验证
- [x] `bun run typecheck` exit 0
- [x] MarkdownEditor html 选项已禁用
- [x] 注释说明 Phase 4 恢复条件
