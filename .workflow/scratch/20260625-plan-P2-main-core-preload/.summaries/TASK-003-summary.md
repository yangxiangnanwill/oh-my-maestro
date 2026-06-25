# TASK-003 Summary: 创建 src/main/lib/app-environment.ts

**状态**: completed
**执行时间**: 2026-06-25T14:09:00+08:00

## 修改的文件

- `apps/desktop/src/main/lib/app-environment.ts` (create) — 应用环境路径常量模块

## 变更内容

- 从 Superset 源复制并完成完整的 SUPERSET → MAESTRO 命名空间替换
- `MAESTRO_DIR_NAME = ".maestro"` — 直接内联定义（不需依赖 shared/constants）
- `MAESTRO_HOME_DIR_ENV = "MAESTRO_HOME"` — 环境变量名替换
- `MAESTRO_HOME_DIR` — 导出路径：`process.env.MAESTRO_HOME ?? join(homedir(), ".maestro")`
- `MAESTRO_HOME_DIR_MODE = 0o700` — 目录权限
- `MAESTRO_SENSITIVE_FILE_MODE = 0o600` — 敏感文件权限
- `ensureMaestroHomeDirExists()` — 创建并 chmod 修复 Maestro 数据目录
- `APP_STATE_PATH` 和 `WINDOW_STATE_PATH` — 状态文件路径常量

## 收敛条件验证

| 条件 | 结果 | 证据 |
|------|------|------|
| 文件存在 | ✅ PASS | `apps/desktop/src/main/lib/app-environment.ts` 存在，1240 bytes |
| 不含 `SUPERSET` (不区分大小写) | ✅ PASS | `grep -ci superset` 返回 0 |
| 包含 MAESTRO_HOME_DIR | ✅ PASS | `grep -c MAESTRO_HOME_DIR` 返回 12 |
| 导出 ensureMaestroHomeDirExists | ✅ PASS | `grep -c` 返回 1 |
