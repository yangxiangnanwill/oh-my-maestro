# TASK-011: link-providers-route.d.ts + SEC-004 + SEC-005 注释

## 变更
- `link-providers-route.d.ts`: 添加 Phase 4 改为 export type 的注释 (ARCH-002)
- `external/index.ts`: openInFinder 添加路径验证 TODO (SEC-004)
- `createMarkdownExtensions.ts`: ENABLE_RAW_MARKDOWN_HTML 添加安全警告 (SEC-005)

## 验证
- [x] `bun run typecheck` exit 0
- [x] 所有注释清晰标记 Phase 4 行动计划
