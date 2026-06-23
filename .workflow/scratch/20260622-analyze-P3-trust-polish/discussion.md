# Discussion: Phase 3 — Trust & Polish

**Session**: ANL-003
**Date**: 2026-06-22
**Milestone**: M3 "Refined — Trust & Polish"
**Phase**: 3 "trust-polish"
**Mode**: Deep Dive
**Dimensions**: architecture, platform, performance, frontend

## Table of Contents
- [Round 1: CLI Exploration](#round-1-cli-exploration)
- [Round 2: Architecture Decisions](#round-2-architecture-decisions)
- [Round 3: Implementation Details](#round-3-implementation-details)
- [Conclusions](#conclusions)
- [Current Understanding](#current-understanding)

## User Intent
分析 Phase 3 "Trust & Polish" 的完整实现方案，覆盖：
1. 审批门控架构设计（状态机 + diff 预览 + WorkflowCommander 集成）
2. Windows ConPTY 兼容性修复
3. 性能优化（状态同步延迟、EventBus、渲染）
4. 前端打磨（审批面板 UI、主题一致性）

---

## Round 1: CLI Exploration

### Sources
- cli-explore-agent: exploration-codebase.json (28 files, 5 call chains, 10 code anchors)
- maestro delegate (claude): Phase 3 架构分析 (进行中)
- maestro delegate (codex): Phase 3 实现分析 (网络错误，重连中)

### Key Findings

#### 1. 审批门控：类型契约就绪但零实现

**发现**: `GateEvents` (PENDING/RESOLVED/APPROVED/REJECTED)、`Channels.GATE`、`ApprovalGate` 接口在 `events.ts` 和 `types.ts` 中已完整定义，但整个代码库中无任何模块发布或订阅这些事件。

**代码锚点**:
- `src/lib/shared/events.ts:9,48-54` — Channels.GATE + GateEvents 已声明
- `src/lib/shared/types.ts:7,87-97` — GateStatus 类型 + ApprovalGate 接口
- `src/lib/server/index.ts:92-100` — POST /api/workflows/execute 直接调用 delegateExecutor.execute()，无门控拦截
- `src/lib/client/components/WorkflowCommander.svelte:33-48` — executeWorkflow() 直接 POST，无确认弹窗

**影响**: Phase 3 需要从零构建 GateManager 模块，包括：
- 服务端 GateManager 类（状态机 + EventBus 集成）
- `/api/workflows/execute` 路由前插入 gate:pending 检查
- 前端 ApprovalPanel 组件（diff 预览 + 确认/拒绝）
- WorkflowCommander 集成（execute 前触发门控流程）

#### 2. Windows ConPTY：3 个关键兼容性问题

**发现**: 当前代码在 Windows 下有 3 个具体问题：

| 问题 | 位置 | 严重度 |
|------|------|--------|
| SIGINT 处理器仅 Linux 有效 | `index.ts:269-273` | HIGH |
| SHELL_WHITELIST 缺 wsl.exe | `terminal-manager.ts:41-50` | MEDIUM |
| ConPTY resize 事件回环风险 | `terminal-manager.ts:192-205` | MEDIUM |

**代码锚点**:
- `src/lib/server/index.ts:269-273` — 仅注册 SIGINT 监听，无 SIGBREAK/exit 兜底
- `src/lib/server/terminal-manager.ts:41-50` — 白名单 8 个 shell，缺 wsl.exe
- `src/lib/server/terminal-manager.ts:114` — win32 分支选择 powershell.exe，未处理 ConPTY 特有行为

#### 3. 性能瓶颈：4 个热点

| 瓶颈 | 位置 | 影响 |
|------|------|------|
| 33ms setInterval 持续运行 | `terminal-manager.ts:261-295` | 无终端活动时仍消耗 CPU |
| EventBus 同步广播无批处理 | `event-bus.ts:59-102` | 高频事件下大量同步迭代 |
| WSGateway 每 client 重复翻译+序列化 | `ws-gateway.ts:124-145` | N 个客户端 = N 次 JSON.stringify |
| 客户端 500ms polling 连接状态 | `stores/index.ts:25-34` | 最多 500ms 延迟检测状态变化 |

**代码锚点**:
- `src/lib/server/terminal-manager.ts:261-295` — 33ms setInterval 帧节流
- `src/lib/server/event-bus.ts:59-102` — publish() 同步遍历所有订阅者
- `src/lib/server/ws-gateway.ts:124-145` — broadcastEvent() 对每个 client 执行翻译+序列化
- `src/lib/client/stores/index.ts:25-34` — 500ms setInterval polling

#### 4. 翻译覆盖度：3 个边缘情况

| 问题 | 位置 | 影响 |
|------|------|------|
| isDialogPayload 过于宽松 | `translator.ts:78-83` | 含 sessionId 的 Gate payload 会被错误跳过翻译 |
| translateString 复合词误替换 | `translations.ts:170-184` | 'chain' → 'Workflow' 会错误替换 'chain-link' |
| 翻译结果无缓存 | `translator.ts:58-71` | 同一 payload 对多个同 mode client 重复计算 |

#### 5. 技术债务：MAINT-002

TerminalManager 和 DialogManager 共享 ~40% session CRUD 模式。Phase 3 是提取泛型 SessionManager<T> 基类的合适时机。

### Intent Coverage Check (Round 1)

| # | Intent | Status | Notes |
|---|--------|--------|-------|
| 1 | 审批门控架构设计 | 🔄 in-progress | 类型就绪，需设计 GateManager + 集成方案 |
| 2 | Windows ConPTY 兼容性 | 🔄 in-progress | 3 个具体问题已识别 |
| 3 | 性能优化 | 🔄 in-progress | 4 个热点已识别 |
| 4 | 前端打磨 | 🔄 in-progress | 审批面板 UI 设计待讨论 |

### Baseline Confidence Scoring

| Dimension | Score | Confidence | Evidence |
|-----------|-------|------------|----------|
| Architecture | 3.5/5 | 65% | GateEvents/ApprovalGate 类型已定义，但 GateManager 需从零设计 |
| Implementation | 3.0/5 | 60% | 代码锚点充足，但集成复杂度高（5 个 Wave 跨 3 个领域） |
| Performance | 3.5/5 | 70% | 4 个热点精确识别，优化方案明确 |
| Security | 4.0/5 | 75% | 审批门控本身是安全增强，现有 XSS/shell 白名单已就绪 |
| Concept | 3.0/5 | 55% | 翻译覆盖度边缘情况需深入讨论 |
| Comparison | N/A | — | 单方案分析，无对比维度 |

**Overall Confidence**: 65% — 需要深入讨论审批门控架构和前端设计

---

## Current Understanding

Phase 3 的核心挑战是审批门控从零构建——类型契约已就绪但需要完整的 GateManager 模块。经过 3 轮讨论，所有关键架构决策已锁定：

**已确立**:
- GateManager 5 状态线性流转（pending→presented→approved/rejected/expired）
- 内联展开审批面板（WorkflowCommander 下方，不阻塞操作）
- MAINT-002 SessionManager 基类在 Phase 3 Wave 1 执行
- 性能优化渐进交付（P0→P1→P2）
- Diff 预览使用 Delegate dry-run（--mode analysis）
- 所有写操作触发门控

**已澄清/修正**:
- RESOLVED 事件语义：统一表示用户已做出决定（approved 或 rejected）
- isDialogPayload 检测需要更精确的 channel 级别判断而非 payload 字段启发式

**关键洞察**:
- GateEvents/ApprovalGate 类型在 M1 阶段预定义，显示架构前瞻性
- Windows 兼容性修复是已知问题集合，非开放式探索
- 性能优化有精确的代码锚点，每级独立可测试

## Decision Trail

| Round | Decision | Choice | Source |
|-------|----------|--------|--------|
| 1 | 分析维度 | 架构+平台+性能+前端 | user |
| 1 | 分析深度 | 深度分析 | user |
| 2 | GateManager 状态机 | 5 状态线性流转 | user |
| 2 | 审批面板 UI | 内联展开面板 | user |
| 2 | MAINT-002 | Phase 3 执行 | user |
| 2 | 性能优化策略 | 按优先级渐进 | user |
| 3 | Diff 数据来源 | Delegate dry-run | user |
| 3 | 门控触发条件 | 所有写操作 | user |

## Intent Coverage Matrix

| # | Original Intent | Status | Where Addressed | Notes |
|---|----------------|--------|-----------------|-------|
| 1 | 审批门控架构设计 | ✅ Addressed | Round 2-3, conclusions.json D-001/D-005/D-006 | 5 状态机 + dry-run + 全写操作 |
| 2 | Windows ConPTY 兼容性 | ✅ Addressed | Round 1 findings, analysis.md | 3 个精确问题 + 修复方案 |
| 3 | 性能优化 | ✅ Addressed | Round 1 findings, conclusions.json D-004 | 4 个热点 + P0→P1→P2 策略 |
| 4 | 前端打磨 | ✅ Addressed | Round 2, conclusions.json D-002 | 内联面板 + Catppuccin Mocha |

## Session Statistics

- **Rounds**: 3 (1 exploration + 2 interactive)
- **Duration**: ~30 min
- **Sources**: cli-explore-agent (28 files, 10 anchors), maestro delegate (claude)
- **Artifacts**: 6 (discussion.md, analysis.md, exploration-codebase.json, conclusions.json, context.md, context-package.json)
- **Decisions**: 8 (6 locked, 4 free, 4 deferred)
