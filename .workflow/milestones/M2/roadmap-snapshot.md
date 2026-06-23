# Roadmap: Maestro IDE

## Overview

Maestro IDE 是基于 maestro-flow 的本地 Web 应用，面向不习惯 CLI 的开发者。本路线图采用渐进式交付策略，分三个里程碑逐步交付：MVP 验证核心价值 → Usable 补全交互能力 → Refined 完善信任与体验。每个里程碑自包含、可演示、可验证。

## Roadmap Decisions

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | 分解策略 | Progressive (MVP → Usable → Refined) | user |
| 2 | 里程碑数量 | 3 | blueprint PM delivery order |
| 3 | Phase 数量 | MVP=1, Usable=1, Refined=1 (共 3 Phase) | minimum-phase principle |
| 4 | Foundation 独立 Phase | 是 — 硬依赖屏障（运行时 + 不可并行 + 全量） | dependency analysis |
| 5 | Core MVP 与 Interaction 合并 | 是 — 可通过接口契约并行开发 | dependency analysis |
| 6 | Trust 纳入 Refined | 是 — 不阻塞 MVP 采用，可渐进交付 | PM-10 |

## Milestones

### Milestone 1: MVP — Workflow Visualization (v0.1.0)

**Target**: 用户打开应用后能实时看到项目状态、一键触发工作流、步骤进度可视化。简单模式下无术语泄漏。

**Status**: active

**Minimum-phase principle**: 1 Phase。Foundation (State Sync + Translator) 是所有功能的硬依赖屏障，必须全量完成后 Core MVP 才能运行。但 Foundation 本身不交付用户可见价值，因此将 Foundation + Core MVP 合并为一个 Phase，内部用 wave DAG 排序。

#### Phases

- [ ] **Phase 1: Foundation + Core MVP** — 搭建基础架构（EventBus + WebSocket + Translator），实现 Project Radar 和 Workflow Commander

#### Phase Details

##### Phase 1: Foundation + Core MVP
**Goal**: 交付 Maestro IDE 的核心价值——工作流可视化编排 + 项目状态实时追踪
**Depends on**: Nothing (first phase)
**Requirements**: REQ-001, REQ-002, REQ-005, REQ-006
**Success Criteria** (what must be TRUE):
  1. 用户打开应用后能实时看到项目 milestone/phase/step 状态，外部 CLI 变更在 5 秒内反映
  2. 用户可通过分类选择或场景分组触发完整工作流链路，步骤进度实时更新
  3. 简单模式下所有用户可见文本无原始 maestro 技术术语泄漏
  4. WebSocket 连接稳定，断线自动重连，状态变更 500ms 内推送

**Wave DAG** (internal task ordering):
```
Wave 1: [项目脚手架 + 共享类型] (并行)
Wave 2: [EventBus + Translator 注册表] (并行)
Wave 3: [WebSocket Gateway + State Sync Engine] (串行依赖)
Wave 4: [Svelte stores + 前端 Translator + UI 布局] (并行)
Wave 5: [Project Radar + Workflow Commander 前端面板] (并行)
Wave 6: [端到端集成测试]
```

---

### Milestone 2: Usable — AI & Terminal (v0.2.0)

**Target**: 用户可通过自然语言与 AI 交互，意图自动路由到工作流；嵌入终端实时显示 CLI 输出。

**Status**: planned

**Minimum-phase principle**: 1 Phase。Terminal Bridge 和 AI Dialog 可通过接口契约并行开发，无需独立 Phase。

#### Phases

- [ ] **Phase 2: Interaction Surfaces** — 实现 Terminal Bridge 和 AI Dialog，连接 Foundation 层

#### Phase Details

##### Phase 2: Interaction Surfaces
**Goal**: 补全交互能力——终端透明可见 + AI 自然语言入口
**Depends on**: Phase 1 (Foundation + Core MVP)
**Requirements**: REQ-003, REQ-004
**Success Criteria** (what must be TRUE):
  1. 用户可在嵌入终端看到实时 CLI 输出，支持多会话切换
  2. 简单模式下终端显示注释化输出，高级模式可切换原始输出
  3. 用户可在 AI Dialog 用自然语言描述需求，系统自动路由到对应工作流
  4. AI Dialog 支持流式输出和 Markdown 渲染
  5. 意图识别置信度低于阈值时展示消歧列表

**Wave DAG**:
```
Wave 1: [node-pty PTY Manager + xterm.js 集成] (并行)
Wave 2: [CLI Adapter Layer (版本化解析)] (依赖 Wave 1)
Wave 3: [Terminal Bridge 前端面板] (依赖 Wave 2)
Wave 4: [Claude Code CLI 子进程管理] (并行)
Wave 5: [AI Dialog 流式聊天 + Intent Router] (依赖 Wave 4)
Wave 6: [Dialog-Commander-Terminal 编排集成] (依赖 Wave 3+5)
```

---

### Milestone 3: Refined — Trust & Polish (v0.3.0)

**Target**: 破坏性操作受审批门控保护；性能优化；Windows 兼容性保障。

**Status**: planned

**Minimum-phase principle**: 1 Phase。Approval Gate 可渐进交付——先覆盖高风险操作，再扩展覆盖范围。

#### Phases

- [ ] **Phase 3: Trust & Polish** — 实现 Approval Gate，性能调优，跨平台兼容

#### Phase Details

##### Phase 3: Trust & Polish
**Goal**: 完善信任层和生产就绪度——审批门控 + 性能优化 + 平台兼容
**Depends on**: Phase 2 (Interaction Surfaces)
**Requirements**: REQ-007
**Success Criteria** (what must be TRUE):
  1. 文件修改类工作流步骤必须经过用户确认后才执行（内联面板，非 modal）
  2. 审批面板展示 diff 预览，高风险操作标红
  3. Windows ConPTY 兼容：使用 SIGINT 而非 SIGTSTP 停止进程，resize 错误自动恢复
  4. 状态同步准确率 > 99%，延迟 < 500ms（P95）
  5. 概念翻译覆盖率 100%，回归测试扫描零泄漏

**Wave DAG**:
```
Wave 1: [ApprovalGate 状态机 + 检测逻辑] 
Wave 2: [Diff 预览 + 内联审批面板] (依赖 Wave 1)
Wave 3: [Gate-WorkflowCommander 集成] (依赖 Wave 2)
Wave 4: [Windows ConPTY 兼容性修复 + 平台测试]
Wave 5: [性能调优 + 概念翻译回归测试套件]
```

---

## Scope Decisions

- **In scope (MVP)**: REQ-001, REQ-002, REQ-005, REQ-006 — 工作流编排 + 状态可视化 + 概念翻译
- **In scope (Usable)**: REQ-003, REQ-004 — AI Dialog + Terminal Bridge
- **In scope (Refined)**: REQ-007 — Approval Gate
- **Deferred (v0.4.0+)**: VS Code extension, JetBrains plugin, 多语言后端, 团队协作
- **Out of scope**: 自研 AI 模型, 代码编辑器, 替代终端

## Progress

| Milestone | Phase | Status | Completed |
|-----------|-------|--------|-----------|
| 1. MVP — Workflow Visualization | 1. Foundation + Core MVP | In progress (scaffold done) | — |
| 2. Usable — AI & Terminal | 2. Interaction Surfaces | Not started | — |
| 3. Refined — Trust & Polish | 3. Trust & Polish | Not started | — |

## Requirements Traceability

| REQ | Milestone | Phase | Priority |
|-----|-----------|-------|----------|
| REQ-001 | M1 MVP | P1 | must |
| REQ-002 | M1 MVP | P1 | must |
| REQ-003 | M2 Usable | P2 | must |
| REQ-004 | M2 Usable | P2 | must |
| REQ-005 | M1 MVP | P1 | must |
| REQ-006 | M1 MVP | P1 | should |
| REQ-007 | M3 Refined | P3 | should |

**All 7 requirements mapped** ✅ | **0 gaps** ✅
