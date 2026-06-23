# Roadmap: Superset + Maestro-flow 融合

## Overview

基于 ANL-007 宏分析结论（Superset UI + Maestro-flow 内核 = 最优方案），本路线图定义 3 Phase 渐进式融合路径：从 CLI 嵌入验证可行性 → 命令链可视化 → 全功能深度融合。每个 Phase 自包含、可验证、可回退。

**当前 oh-my-maestro 项目将在 Phase 0（环境准备）中归档删除，此后所有工作基于 Superset 代码库进行。**

## Roadmap Decisions

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | 分解策略 | Progressive (3 Phase 串行) | ANL-007 scope_verdict=large |
| 2 | Phase 数量 | 3（+ Phase 0 环境准备） | 硬依赖屏障验证 |
| 3 | Maestro-flow 运行方式 | Phase 1: 子进程 → Phase 3: 平台无关模块 | context.md Free decision |
| 4 | 前端框架 | React（Superset 默认），概念翻译层在 React 中重写 | context.md Free decision |
| 5 | 命令存储位置 | .agents/（Superset）为主，.claude/ 保留 | context.md Free decision |
| 6 | 状态同步机制 | 文件轮询（Phase 1）→ tRPC/WebSocket（Phase 3） | context.md Free decision |
| 7 | Windows 优先级 | Phase 0 必须解决 — 当前开发环境 | ANL-007 locked constraint |

## Milestones

### Milestone 1: Foundation — 基础打通 (v0.1.0)

**Target**: Superset 可在 Windows 上运行，Maestro-flow CLI 可在 Superset 终端面板中正常执行。oh-my-maestro 已归档。

**Status**: planned

**Minimum-phase principle**: 2 Phase。Phase 0（环境准备）是 Phase 1（CLI 嵌入）的硬依赖屏障 — 必须先解决 Windows 兼容性才能开始集成。Phase 2-3 归入 M2。

#### Phases

- [ ] **Phase 0: Environment Bootstrap** — Windows 平台兼容 + 项目归档
- [ ] **Phase 1: CLI 嵌入** — Maestro-flow 在 Superset 终端面板中可执行

#### Phase Details

##### Phase 0: Environment Bootstrap
**Goal**: Superset 可在 Windows 上构建运行，oh-my-maestro 归档
**Depends on**: Nothing
**Requirements**: REQ-F-000 (derived)
**Success Criteria** (what must be TRUE):
  1. `bun install && bun run dev` 在 Windows 上成功完成（API + Desktop 启动）
  2. Electron 桌面应用窗口正常打开，终端面板可输入命令
  3. oh-my-maestro 项目目录已删除，关键设计文档（概念翻译层）已提取至 Superset 文档
  4. Git 仓库切换到 Superset 代码库，oh-my-maestro 历史保留在归档分支

**Wave DAG** (internal task ordering):
```
Wave 1: [Windows 构建环境诊断 + 修复清单] (单任务)
Wave 2: [Electron 构建修复 + Bun/依赖适配 + PTY 管理器修复] (并行)
Wave 3: [概念翻译层设计文档提取 + oh-my-maestro 归档删除] (并行)
Wave 4: [Windows 端到端验证 + 回归测试]
```

##### Phase 1: CLI 嵌入
**Goal**: Maestro-flow 在 Superset 终端面板中可作为命令执行，`maestro` 命令输出正常显示
**Depends on**: Phase 0 (Environment Bootstrap)
**Requirements**: REQ-F-001
**Success Criteria** (what must be TRUE):
  1. 在 Superset 终端面板中输入 `maestro` 能看到命令输出
  2. `maestro search` 能在项目目录中正常搜索
  3. `maestro ralph skills` 能列出可用 skill
  4. Maestro-flow CLI 以 Node.js 子进程方式运行，xterm.js 正确渲染输出
  5. 终端多会话支持（普通终端 + Maestro 专用终端）

**Wave DAG**:
```
Wave 1: [Maestro-flow 依赖分析 + Node.js 环境检测]
Wave 2: [Agent Preset 注册: maestro 作为可识别 Agent 类型]
Wave 3: [Terminal 集成: 子进程管理 + xterm.js 输出渲染]
Wave 4: [命令兼容性测试: 全部 maestro 子命令可执行]
Wave 5: [错误处理 + 进程生命周期管理]
Wave 6: [Windows 端到端测试]
```

---

### Milestone 2: Orchestration — 编排可视化 (v0.2.0)

**Target**: 用户可在 Superset UI 中可视化看到 Maestro-flow 的命令链步骤进度、决策节点、完成状态。

**Status**: planned

#### Phases

- [ ] **Phase 2: 命令链 UI** — status.json 状态渲染为可视化面板

#### Phase Details

##### Phase 2: 命令链 UI
**Goal**: Maestro-flow 的命令链（status.json）在 Superset UI 中渲染为可交互的步骤进度面板
**Depends on**: Phase 1 (CLI 嵌入)
**Requirements**: REQ-F-002
**Success Criteria** (what must be TRUE):
  1. 执行 `maestro` 命令链后，Superset 侧边栏显示步骤进度（Step 1/5、Step 2/5...）
  2. 每个步骤显示状态（pending/running/completed/failed）和耗时
  3. 决策节点以可视化方式展示（分支选择、Go/No-Go 结论）
  4. 完成状态自动刷新（文件轮询 status.json，延迟 < 2s）
  5. 简单模式：术语翻译 — 命令链步骤名 → 用户可理解的中文描述

**Wave DAG**:
```
Wave 1: [status.json 读取服务: 文件轮询 + 解析]
Wave 2: [步骤进度面板: React 组件 + shadcn/ui 进度指示器]
Wave 3: [决策节点可视化: 分支图 + 结论渲染]
Wave 4: [概念翻译层: Maestro 术语 → 用户友好中文（基于 Phase 0 设计文档）]
Wave 5: [简单/高级模式切换 + localStorage 持久化]
Wave 6: [实时刷新: 文件 watch + SSE push]
```

---

### Milestone 3: Deep Integration — 深度融合 (v0.3.0)

**Target**: Maestro-flow 的知识图谱、6 维分析、自适应决策能力通过 Superset MCP 端点暴露，形成完整闭环。

**Status**: planned

#### Phases

- [ ] **Phase 3: 全功能融合** — KG + 分析 + 决策 + MCP 集成

#### Phase Details

##### Phase 3: 全功能融合
**Goal**: Maestro-flow 的 KG、分析、决策能力通过 Superset 的 MCP 端点暴露，Agent 可调用
**Depends on**: Phase 2 (命令链 UI)
**Requirements**: REQ-F-003
**Success Criteria** (what must be TRUE):
  1. Maestro-flow 的 MCP server 注册为 Superset 的 MCP provider
  2. `maestro search` 结果在 Superset 的知识面板中可视化
  3. `maestro-analyze` 的 6 维评分结果在 UI 中渲染为评分卡
  4. `maestro-ralph` 的决策节点与 Superset 的 Agent 生命周

期联动
  5. 70+ command 和 425+ skill 迁移到 Superset 命令面板（可搜索、可触发）
  6. 完整的终端到终

端演示：自然语言需求 → 命令链执行 → UI 可视化 → 决策 → 执行 → 完成

**Wave DAG**:
```
Wave 1: [MCP Server 集成: Maestro MCP → Superset MCP registry]
Wave 2: [知识面板: KG 搜索 + 语义结果渲染]
Wave 3: [分析面板: 6 维评分 + 风险矩阵 UI]
Wave 4: [命令面板: 70+ command 迁移 + 搜索 + 一键触发]
Wave 5: [Agent 生命周期联动: Ralph 决策 → Superset Agent hooks]
Wave 6: [端到端集成测试 + 演示录制]
```

---

## Scope Decisions

- **In scope**: REQ-F-000（Windows 兼容）、REQ-F-001（CLI 嵌入）、REQ-F-002（命令链 UI）、REQ-F-003（全功能融合）
- **Deferred (v0.4.0+)**: 移动端支持、VS Code 插件、JetBrains 插件、生产部署、多语言后端
- **Out of scope**: 自研 AI 模型、代码编辑器替代、终端替代、自有 Agent SDK

## Progress

| Milestone | Phase | Status | Completed |
|-----------|-------|--------|-----------|
| 0. Foundation | 0. Environment Bootstrap | Not started | — |
| 0. Foundation | 1. CLI 嵌入 | Not started | — |
| 1. Orchestration | 2. 命令链 UI | Not started | — |
| 2. Deep Integration | 3. 全功能融合 | Not started | — |

## Requirements Traceability

| REQ | Milestone | Phase | Priority |
|-----|-----------|-------|----------|
| REQ-F-000 | M1 Foundation | P0 | must |
| REQ-F-001 | M1 Foundation | P1 | must |
| REQ-F-002 | M2 Orchestration | P2 | must |
| REQ-F-003 | M3 Deep Integration | P3 | should |

**All 4 requirements mapped** ✅ | **0 gaps** ✅
