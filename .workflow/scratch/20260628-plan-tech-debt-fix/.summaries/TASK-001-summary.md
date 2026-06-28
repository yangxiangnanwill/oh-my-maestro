# TASK-001: 修复 auth-functions.ts 缩进 + workspace-navigation.ts 未使用参数

## 变更
- `auth-functions.ts`: loadToken 函数体 tab→2空格缩进 (MAINT-005)
- `workspace-navigation.ts`: _opts 参数添加 JSDoc @param 注释 + TODO (BP-006)

## 验证
- [x] `bun run typecheck` exit 0
- [x] auth-functions.ts 缩进一致（2空格）
- [x] workspace-navigation.ts _opts 有文档注释
