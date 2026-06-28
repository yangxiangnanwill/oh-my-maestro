# TASK-010: tabs/store + useHandleOpenedWorktree + as never TODO

## 变更
- `tabs/store.ts`: openInBrowserPane 存储 url 到 pane 对象 (MAINT-002)；计数器添加 HMR 注释 (ARCH-003)
- `useHandleOpenedWorktree.ts`: paneId 添加 Phase 4 TODO (COR-004)
- `AgentSelect.tsx`: as never 添加 TODO (BP-002)
- `workspace-navigation.ts`: as never 添加 TODO (已在 TASK-001 处理)

## 验证
- [x] `bun run typecheck` exit 0
- [x] pane 对象包含 url 字段
- [x] 所有 as never 断言有 TODO 注释
