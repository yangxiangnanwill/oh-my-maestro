# Context: Phase 1 — CLI 嵌入

**Date**: 2026-06-23
**Source**: ANL-009 (Phase 1 分析)
**Areas discussed**: Maestro-flow CLI 集成策略、Agent 注册方式、终端兼容性

## Decisions

### Decision 1: 集成方式
- **Context**: 将 Maestro-flow CLI 集成到 Superset 终端
- **Options**:
  1. 方案 A: Custom Agent API（tRPC createCustomAgent）— 推荐
  2. 方案 B: 内置 Agent Wrapper（agent-wrappers-maestro.ts）
  3. 方案 C: 手动终端执行
- **Chosen**: 方案 A（Phase 1）
- **Reason**: 利用已有 API，最小侵入；方案 B 是 Phase 3 目标

### Decision 2: 终端集成策略
- **Context**: Maestro-flow 命令在 Superset 终端中如何执行
- **Options**:
  1. 方案 A: 注册为 Agent Preset，通过 Agent 启动流程执行
  2. 方案 B: 直接通过终端 panel 的 shell 执行
- **Chosen**: 方案 A
- **Reason**: 利用 Superset 的 Agent 生命周期管理、输出捕获、状态追踪

### Decision 3: 环境配置
- **Context**: Maestro-flow 需要在正确的目录和环境变量下运行
- **Options**:
  1. 方案 A: 使用全局 MAESTRO_HOME，所有 workspace 共享配置
  2. 方案 B: 每个 workspace 独立配置
- **Chosen**: 方案 A
- **Reason**: Phase 1 最小化，后续可扩展到 per-workspace

## Constraints

### Locked
1. **必须使用 Superset 现有的 Agent 基础设施** — 不修改 agent 核心框架
2. **必须支持 Windows 终端** — Phase 0 已验证 ConPTY
3. **maestro 核心子命令必须可执行** — search、ralph skills、spec load
4. **命令输出必须在 xterm.js 中正确渲染** — 包括 ANSI 颜色和 Unicode

### Free
1. **Agent Preset 命名** — "Maestro" 或 "Maestro-flow"
2. **默认命令列表** — 哪些 maestro 子命令设为快捷入口
3. **任务提示模板** — taskPromptTemplate 内容
4. **图标** — 使用哪个 Superset 图标

### Deferred
1. **命令链状态可视化** — Phase 2 目标
2. **知识图谱集成** — Phase 3 目标
3. **Maestro-flow Agent Wrapper 原生支持** — Phase 3 目标
4. **Per-workspace 配置隔离** — Phase 2+

## Code Context

**关键文件：**
- `apps/desktop/src/lib/trpc/routers/settings/agent-preset-router.utils.ts` — Agent Preset schema
- `apps/desktop/src/lib/trpc/routers/settings/index.ts:273` — createCustomAgent mutation
- `apps/desktop/src/renderer/lib/agent-launch-command.ts` — Agent 命令构建
- `apps/desktop/src/renderer/lib/agent-session-orchestrator/` — Agent 生命周期管理
- `apps/desktop/src/main/lib/terminal/env.ts` — Shell 环境（Phase 0 已修改）
- `apps/desktop/src/main/lib/agent-setup/` — Agent 二进制 wrapper

**Maestro-flow 命令入口：**
- `maestro search` — 代码搜索
- `maestro ralph skills` — 技能列表
- `maestro spec load` — 规格加载
- `maestro ralph next` — 工作流步骤推进
