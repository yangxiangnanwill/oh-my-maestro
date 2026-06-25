# TASK-004 Summary: 复制 terminal-host/ 全部 13 个文件

**状态**: completed
**执行时间**: 2026-06-25T14:10:00+08:00 - 14:18:00+08:00

## 修改的文件

- `apps/desktop/src/main/terminal-host/index.ts` (create + adapt)
- `apps/desktop/src/main/terminal-host/pty-subprocess.ts` (create)
- `apps/desktop/src/main/terminal-host/pty-subprocess-ipc.ts` (create)
- `apps/desktop/src/main/terminal-host/session.ts` (create)
- `apps/desktop/src/main/terminal-host/session.test.ts` (create)
- `apps/desktop/src/main/terminal-host/session-shell-ready.test.ts` (create)
- `apps/desktop/src/main/terminal-host/signal-handlers.ts` (create)
- `apps/desktop/src/main/terminal-host/terminal-host.ts` (create)
- `apps/desktop/src/main/terminal-host/terminal-host.test.ts` (create)
- `apps/desktop/src/main/terminal-host/test-helpers.ts` (create)
- `apps/desktop/src/main/terminal-host/transient-error-window.ts` (create)
- `apps/desktop/src/main/terminal-host/transient-error-window.test.ts` (create)
- `apps/desktop/src/main/terminal-host/xterm-env-polyfill.ts` (create)

## 变更内容

- 从 Superset 源完整复制 13 个文件
- 仅改造 `index.ts`: `SUPERSET_DIR_NAME` → `MAESTRO_DIR_NAME` (3处引用)
- 其余 12 个文件直接复制（无品牌相关内容需替换）
- 文件大小总计约 130KB

## 收敛条件验证

| 条件 | 结果 | 证据 |
|------|------|------|
| 目录包含 13 个文件 | ✅ PASS | `ls | wc -l` 返回 13 |
| 不含 SUPERSET_DIR_NAME | ✅ PASS | `grep -rc` 返回 0 |
| index.ts 导入 MAESTRO_DIR_NAME | ✅ PASS | `grep -c` 返回 3 |
