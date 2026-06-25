# TASK-006 Summary: 创建 windows/main.ts

**状态**: completed
**执行时间**: 2026-06-25T14:21:00+08:00

## 修改的文件

- `apps/desktop/src/main/windows/main.ts` (create) — 主窗口创建模块

## 变更内容

- 从 Superset 源复制 windows/main.ts
- 从 `~/package.json` 读取 `productName`（自动适配 oh-my-maestro 的 package.json）
- preload 路径设置为 `join(__dirname, '../preload/index.js')`（标准 electron-vite 输出路径）
- partition 名称 `persist:superset` → `persist:maestro`
- 移除 Superset 品牌引用的通知和注释
- 保留 BrowserWindow 创建、IPC 处理和窗口状态持久化逻辑
- 导出 `MainWindow` 异步函数

## 收敛条件验证

| 条件 | 结果 | 证据 |
|------|------|------|
| 文件存在 | ✅ PASS | `apps/desktop/src/main/windows/main.ts` 存在，6570 bytes |
| 导出 MainWindow | ✅ PASS | `grep -c "export.*MainWindow"` 返回 1 |
| partition 为 persist:maestro | ✅ PASS | `grep -c persist:maestro` 返回 1 |
| 不含 persist:superset | ✅ PASS | `grep -c persist:superset` 返回 0 |
| preload 路径正确 | ✅ PASS | `grep -c "preload.*index.js"` 返回 1 |
