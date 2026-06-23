# Context: Phase 0 — Environment Bootstrap

**Date**: 2026-06-22
**Source**: ANL-008 (Phase 0 分析)
**Areas discussed**: Windows 兼容性修复策略、oh-my-maestro 归档方式、概念翻译层保留

## Decisions

### Decision 1: Windows 兼容性修复策略
- **Context**: Superset 目前仅支持 macOS，需要在 Windows 上构建运行
- **Options**:
  1. 方案 A: 直接修复 Superset 源码（推荐）
  2. 方案 B: WSL2 绕过
  3. 方案 C: 放弃 Windows
- **Chosen**: 方案 A
- **Reason**: 代码库已有 22+ 处跨平台条件分支，修复范围可控（20-25 变更点）；WSL2 会增加性能开销和维护复杂度

### Decision 2: Shell 适配方式
- **Context**: Windows 默认 PowerShell/CMD，非 zsh/bash
- **Options**:
  1. 方案 A: 扩展 getDefaultShell() 返回 PowerShell，添加 Windows 特定配置
  2. 方案 B: 要求用户安装 Git Bash
- **Chosen**: 方案 A
- **Reason**: 减少用户依赖，PowerShell 是 Windows 原生体验

### Decision 3: oh-my-maestro 归档方式
- **Context**: 用户确认立即删除
- **Options**:
  1. 方案 A: 创建归档分支 → 删除工作目录（推荐）
  2. 方案 B: 仅删除目录
- **Chosen**: 方案 A
- **Reason**: 保留 git history 供未来参考

### Decision 4: 概念翻译层保留
- **Context**: oh-my-maestro 的核心差异化设计
- **Options**:
  1. 方案 A: 完整提取设计文档 + 代码注释（推荐）
  2. 方案 B: 仅保留 translations.ts 文件
- **Chosen**: 方案 A
- **Reason**: 设计理念（简单/高级模式、DisplayMode、隐藏规则）比代码更重要

## Constraints

### Locked
1. **必须在 Windows 上运行** — `bun install && bun run dev` 成功
2. **必须保留概念翻译层设计** — translations.ts + translator.ts 逻辑文档化
3. **必须归档 oh-my-maestro** — 用户确认
4. **Electron 桌面应用窗口正常打开** — 终端面板可用

### Free
1. **字体路径替换** — 可用 Windows 默认字体或跳过系统字体协议
2. **setup.local.sh 替代方案** — PowerShell 脚本或手动配置
3. **原生模块编译方式** — VS Build Tools 或 node-gyp 预编译

### Deferred
1. **Docker/Caddy 本地环境** — Phase 1+ 再处理
2. **Windows 安装包签名** — 发布时才需要
3. **Windows 通知集成** — Phase 2+ 

## Code Context

**需要修改的关键文件：**
- `apps/desktop/src/main/index.ts:363` — 系统字体路径（macOS 硬编码）
- `apps/desktop/src/main/lib/terminal/env.ts` — getDefaultShell() Windows 适配
- `apps/desktop/src/main/lib/agent-setup/utils.ts:56` — findBinaryPathsWindows() 已存在
- `apps/desktop/src/main/lib/resource-metrics/process-tree.ts:9` — macOS 依赖已 try/catch 保护
- `apps/desktop/src/main/lib/apple-events-permission.ts:13` — 已有 darwin 守卫
- `apps/desktop/src/main/lib/dock-icon.ts:212` — 已有 darwin 守卫
- `apps/desktop/src/main/lib/tray/index.ts:278` — 已有 darwin 守卫

**oh-my-maestro 关键文件（需提取设计文档）：**
- `src/lib/shared/translations.ts` — 概念翻译注册表
- `src/lib/server/translator.ts` — 翻译引擎 + DisplayMode
