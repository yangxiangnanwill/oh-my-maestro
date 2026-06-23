# Context: Superset + Maestro-flow 融合决策

**Date**: 2026-06-22
**Source**: ANL-007 (宏分析)
**Areas discussed**: 技术栈调和、架构融合策略、功能迁移方案、oh-my-maestro 去留

## Decisions

### Decision 1: 融合方案选择
- **Context**: 评估 Superset 与 Maestro-flow 兼容性后的融合方向
- **Options**:
  1. 方案 A: Superset UI + Maestro-flow 内核（推荐）
  2. 方案 B: Superset 独立发展，重新实现 Maestro 能力
  3. 方案 C: 保留 oh-my-maestro，从 Superset 学习
- **Chosen**: 方案 A
- **Reason**: 两者互补性最强 — Superset 有成熟的 Agent UI 和跨 agent 支持，Maestro-flow 有强大的编排引擎。融合后最大化已有投资

### Decision 2: 技术栈调和方式
- **Context**: Superset (Bun+React) vs Maestro-flow (Node.js+TypeScript)
- **Options**:
  1. Maestro-flow 以子进程方式运行 Node.js → 通过 IPC/tRPC 通信
  2. 将 Maestro-flow 代码迁移到 Bun 运行时
  3. 将 Maestro-flow 的核心逻辑提取为平台无关的 TypeScript 模块
- **Chosen**: 方案 1（子进程方式）作为 Phase 1，逐步迁移到方案 3
- **Reason**: 最小风险、最快验证；保留 Maestro-flow 的完整性

### Decision 3: oh-my-maestro 项目去留
- **Context**: 当前 oh-my-maestro 在 M3 阶段，与 Superset 功能重叠
- **Options**:
  1. 立即删除，基于 Superset 重新开始
  2. 保留作为参考，等待 Superset 集成完成后删除
  3. 继续独立开发
- **Chosen**: 立即删除（用户确认）
- **Reason**: Superset 已实现并超越 oh-my-maestro 核心愿景；保留会造成分心

### Decision 4: 集成策略
- **Context**: 如何将 Maestro-flow 逐步集成到 Superset
- **Options**:
  1. 大爆炸式一次性替换
  2. 渐进式 3 Phase 集成
- **Chosen**: 渐进式 3 Phase
- **Reason**: 每 Phase 可独立验证和回退，降低风险

## Constraints

### Locked
1. **必须保留 Maestro-flow 的命令链系统** — 70+ command、Ralph 协议是核心差异化能力
2. **必须保留概念翻译层设计** — 面向非 CLI 用户的产品理念不可丢失
3. **必须支持 Windows 平台** — 当前开发环境
4. **必须采用 MCP 作为 Agent 通信协议** — Superset 的架构基础
5. **必须清空 oh-my-maestro** — 用户已确认删除

### Free
1. **前端框架选择** — React (Superset 默认) 或保留 SvelteKit 部分组件
2. **Maestro-flow 运行方式** — 子进程 / Bun 直接运行 / 平台无关模块
3. **命令存储位置** — .agents/ (Superset) 或 .claude/ (Maestro-flow 默认)
4. **状态同步机制** — tRPC / WebSocket / 文件轮询

### Deferred
1. **移动端支持** — Superset apps/mobile (React Native) 暂不涉及
2. **多语言后端** — 暂不涉及
3. **VS Code / JetBrains 插件** — 未来考虑
4. **生产部署配置** — 当前仅关注开发环境

## Code Context

- Superset Agent System: `apps/desktop/src/main/lib/agent-setup/`
- Superset MCP Endpoint: `apps/api/src/app/api/agent/[transport]/route.ts`
- Superset Agent Presets: `apps/desktop/src/lib/trpc/routers/settings/agent-preset-router.utils.ts`
- Maestro-flow Ralph Engine: `src/ralph/`
- Maestro-flow Coordinator: `src/coordinator/`
- Maestro-flow Commands: `.claude/commands/`
- Maestro-flow Skills: `.claude/skills/`
