# Task: TASK-012 补充终端管理: terminal/ 核心模块 + terminal-escape-filter + terminal-history

## Implementation Summary

### Files Verified/Updated
- `apps/desktop/src/main/lib/terminal/` (20 files): 终端会话和 daemon 管理完整框架
- `apps/desktop/src/main/lib/terminal/daemon/` (8 files): daemon 管理器子模块
- `apps/desktop/src/main/lib/terminal-escape-filter.ts`: 终端转义码过滤 (已存在，已验证无品牌引用)
- `apps/desktop/src/main/lib/terminal-history.ts`: 终端历史记录 (已存在，已修复变量名)

### Changes Made
- `terminal-history.ts`: 将 `SUPERSET_DIR_NAME` 变量名改为 `MAESTRO_DIR_NAME` (值保持 ".maestro")
- 所有文件已验证: 无 Superset 品牌引用，import 路径正确

### Key Components
- **terminal/index.ts**: 终端 create/attach/list/dispose API 入口
- **terminal/session.ts**: HeadlessTerminal + node-pty 会话管理
- **terminal/env.ts**: 终端环境变量构建 (allowlist 过滤 + shell wrapper 注入)
- **terminal/port-manager.ts**: 端口冲突检测和自动清理
- **terminal/pty-write-queue.ts**: PTY 写入队列 (防 backpressure)
- **terminal/abort.ts**: 终端操作取消支持
- **terminal/errors.ts**: 终端错误类型定义
- **terminal/types.ts**: 终端类型定义
- **terminal/daemon/daemon-manager.ts**: 守护进程管理 (session reattach、cold restore)
- **terminal/daemon/history-manager.ts**: 滚动历史管理
- **terminal/daemon/priority-semaphore.ts**: 优先级信号量 (防并发冲突)
- **terminal-escape-filter.ts**: 清除滚动缓冲序列检测和过滤
- **terminal-history.ts**: 终端历史持久化 (HistoryWriter/HistoryReader)

## Verification
- [x] terminal/ 目录存在且包含 20 个文件
- [x] terminal-escape-filter.ts 存在
- [x] terminal-history.ts 存在
- [x] 所有文件 import 路径正确 (TypeScript typecheck 无 terminal/ 错误)
- [x] 不含 Superset 品牌特定引用

## Status: Completed
