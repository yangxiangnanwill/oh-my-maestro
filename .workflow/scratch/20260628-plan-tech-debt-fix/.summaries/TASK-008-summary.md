# TASK-008: auth-functions.ts stub 改进

## 变更
- `auth-functions.ts`: 所有 stub 函数添加 Phase 4 实现说明和安全注释 (COR-001/002, SEC-002/003)
- parseAuthDeepLink 返回值从 {} 改为 null (COR-001 修复)
- validateAuthToken 添加安全注释
- handleAuthCallback 添加实现说明
- authEvents 添加可见性注释

## 验证
- [x] `bun run typecheck` exit 0
- [x] parseAuthDeepLink 返回 null，调用方 if (authParams) 正确跳过
- [x] 所有 stub 函数有 Phase 4 注释
