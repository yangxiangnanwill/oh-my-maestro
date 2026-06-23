# Context: Phase 3 — Full Integration (全功能融合)

**Date**: 2026-06-24
**Source**: ANL-011 (Phase 3 深度分析)
**Areas discussed**: MCP Server 集成、知识面板、分析面板、命令面板、Agent 生命周期联动

## Decisions

### Decision 1: Phase 3 在家环境（完整 Superset repo）启动
- **Context**: 当前 oh-my-maestro checkout 仅包含 apps/desktop/，缺失 packages/mcp-v2/ 和 agent-setup 模块
- **Options**:
  1. 在家环境获取 Superset 完整 monorepo 后启动
  2. 在当前环境用独立 HTTP API 绕过 MCP registry
- **Chosen**: Option 1
- **Reason**: MCP registry 是标准化的基础设施，绕过它会产生技术债

### Decision 2: MCP Server 集成 (Wave 1) 优先
- **Context**: 6 Wave DAG 排序
- **Chosen**: Wave 1 (MCP Server 注册) 作为最高优先级
- **Reason**: MCP transport 是 KG 搜索、分析结果、命令面板的共同基础设施

### Decision 3: 复用 Phase 2 组件模式
- **Context**: CommandChainPanel 已实现 Loading/Error/Empty/Data 四态渲染
- **Chosen**: 抽取 StatusPanel 通用组件，KnowledgePanel 和 AnalysisPanel 基于此构建
- **Reason**: 避免重复造轮子，保持一致 UI 体验

## Constraints

### Locked
- MCP 协议作为集成标准（ANL-007 locked constraint）
- Windows 平台兼容（ANL-007 locked constraint）
- 不破坏 Phase 1-2 的现有功能（command-chain UI + CLI 嵌入）
- Phase 3 在家环境启动（本次分析 CONDITIONAL GO）

### Free
- KnowledgePanel 和 AnalysisPanel 的具体 UI 设计（实现者自行决定）
- 命令面板的分批迁移策略（Wave 4 先做 20 高频 command）
- WebSocket vs SSE 作为事件推送协议

### Deferred
- 移动端支持 → v0.4.0+
- VS Code / JetBrains 插件 → v0.4.0+
- 生产部署 → v0.4.0+
- 剩余 50+ command 迁移 → Phase 3 后续迭代

## Code Context

**现有集成点**:
- `apps/desktop/src/main/index.ts:417-421` — `setupAgentHooks()` 调用点（MCP 注册插入点）
- `apps/desktop/src/main/lib/terminal/env.ts:504-506` — `MAESTRO_HOME` 环境变量注入
- `apps/desktop/src/lib/trpc/routers/command-chain/index.ts` — 现有 tRPC 路由（可扩展新 endpoints）
- `apps/desktop/src/renderer/components/CommandChainPanel/` — 可复用的 3 态渲染模式

**缺失模块**（在家环境获取）:
- `packages/mcp-v2/src/server.ts` — Superset MCP v2 server (28 tools)
- `apps/desktop/src/main/lib/agent-setup/` — Agent hooks 实现

**Maestro-flow 核心模块**（外部仓库）:
- `mcp/` — Maestro MCP Server 实现
- `graph/` — 知识图谱
- `ralph/` — Ralph 生命周期引擎

## Next Steps

在家环境执行:
1. `git pull origin master` — 拉取最新代码
2. 获取 Superset 完整 monorepo
3. `/maestro-plan 3` — 生成 Phase 3 执行计划
