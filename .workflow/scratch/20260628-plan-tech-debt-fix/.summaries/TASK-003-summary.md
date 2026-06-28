# TASK-003: presets/index.ts 提取重复 invalidation 函数

## 变更
- `presets/index.ts`: 提取 `invalidatePresetRelatedQueries()` 函数，5 个 mutation hook 复用 (MAINT-003)
- 添加跨层导入注释 (BP-005)

## 验证
- [x] `bun run typecheck` exit 0
- [x] 5 个 mutation hook 的 onSuccess 均调用同一函数
- [x] 函数签名类型正确
