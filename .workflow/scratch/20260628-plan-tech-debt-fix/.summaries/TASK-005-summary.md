# TASK-005: noImplicitAny 注释 + 文档化

## 变更
- `tsconfig.json`: 为 noImplicitAny: false 添加详细注释，说明 Phase 4 恢复计划 (BP-001)

## 决策
保持 noImplicitAny: false，因为恢复 true 会导致大量新错误（Phase 3 stub 阶段不适合大规模注解）。
已在注释中明确标记为临时措施。

## 验证
- [x] `bun run typecheck` exit 0
- [x] 注释包含 Phase 4 恢复说明
