# TASK-004: stores/index.ts 注释 + tsconfig 注释

## 变更
- `stores/index.ts`: 添加注释说明使用 useSyncExternalStore 而非 zustand 的原因 (ARCH-004)
- `tsconfig.json`: noImplicitAny 添加 Phase 4 恢复计划注释 (BP-001 文档化)

## 验证
- [x] `bun run typecheck` exit 0
- [x] stores/index.ts 注释清晰说明设计决策
- [x] tsconfig.json 注释标记了临时措施和恢复计划
