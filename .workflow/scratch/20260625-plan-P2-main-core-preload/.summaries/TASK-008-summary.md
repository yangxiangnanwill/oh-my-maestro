# TASK-008 Summary: 合并 main/index.ts

**状态**: completed
**执行时间**: 2026-06-25T14:25:00+08:00 - 14:30:00+08:00

## 修改的文件

- `apps/desktop/src/main/index.ts` (modify) — 应用主入口文件增量修改

## 变更内容

### 协议方案名替换
- `protocol.registerSchemesAsPrivileged` 中的 `superset-icon` → `maestro-icon`
- `protocol.registerSchemesAsPrivileged` 中的 `superset-font` → `maestro-font`
- `protocol.handle("superset-icon", ...)` → `protocol.handle("maestro-icon", ...)`
- `protocol.handle("superset-font", ...)` → `protocol.handle("maestro-font", ...)`

### Session partition 替换
- `session.fromPartition("persist:superset")` → `session.fromPartition("persist:maestro")`（两处）

### 品牌标识替换
- `app.setName("Superset (${workspaceName})")` → `app.setName("Maestro (${workspaceName})")`
- 确认退出对话框标题：`"Quit Superset"` → `"Quit Maestro"`

### 保留的 Maestro 特有功能
- `registerMaestroMcpProvider` 和 `checkMaestroCliAvailable` 导入和调用保留
- `./lib/agent-setup/maestro-mcp-provider` 导入保留
- `setupAgentHooks` 导入和调用保留
- `installBundledCliShim` 导入和调用保留
- `createRalphDecisionBridge` 相关调用保留
- Windows 字体目录支持保留（L374-376）

## 收敛条件验证

| 条件 | 结果 | 证据 |
|------|------|------|
| 不含 superset-icon/superset-font | ✅ PASS | `grep -c` 返回 0 |
| 包含 maestro-icon/maestro-font | ✅ PASS | `grep -c` 返回 6 |
| 不含 persist:superset | ✅ PASS | `grep -c` 返回 0 |
| 包含 persist:maestro | ✅ PASS | `grep -c` 返回 2 |
| 含 "Quit Maestro" | ✅ PASS | `grep -c` 返回 1 |
| 保留 Maestro 特有功能 | ✅ PASS | `grep -c registerMaestroMcpProvider` 返回 2 |
