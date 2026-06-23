# Analysis: Phase 2 — Interaction Surfaces

**Session**: ANL-002
**Date**: 2026-06-21
**Scope**: Phase 2 (interaction-surfaces), M2 — Usable — AI & Terminal
**Mode**: Deep Dive (深度分析)

## Executive Summary

Phase 2 需要在 M1 Foundation 层之上构建 Terminal Bridge（xterm.js + node-pty）和 AI Dialog（Claude Code CLI + 意图路由）。分析确认：

1. **架构就绪** — `events.ts` 和 `types.ts` 已预留所有 Phase 2 类型和通道，WSGateway 的 `default` 转发分支使新消息类型零修改接入
2. **node-pty 是正确选择** — 交互式终端需要 PTY 语义（ANSI、resize、交互程序），`child_process.spawn` 无法满足
3. **性能是关键挑战** — PTY 高频输出（2000 行/秒）需要帧节流（33ms）和背压控制，否则 3.3x 积压因子导致事件循环阻塞
4. **DialogManager 可复用 DelegateExecutor 模式** — spawn/parse/emit 架构直接适用

**Overall Assessment**: GO — 架构基础充分，风险可控，建议进入规划阶段。

## Dimension Scoring

### 1. Feasibility (可行性) — Score: 4/5

| Factor | Score | Evidence |
|--------|-------|----------|
| 技术难度 | 4 | node-pty 和 xterm.js 是成熟库，集成模式明确 |
| 团队能力 | 4 | M1 已建立子进程管理和 WebSocket 基础设施 |
| 时间估算 | 3 | 6 Wave DAG，估计 8-12 小时开发 + 测试 |
| 工具链 | 4 | 所有依赖可通过 npm 安装，无需额外工具 |

**Confidence**: 88% (高)
**Evidence**: exploration-codebase.json#extension_points, cld-142003-2a41

### 2. Impact (影响) — Score: 5/5

| Factor | Score | Evidence |
|--------|-------|----------|
| 用户价值 | 5 | AI 自然语言入口 + 终端透明可见是核心差异化功能 |
| 业务价值 | 5 | 直接解决目标用户（非 CLI 习惯开发者）的核心痛点 |
| 技术债务减少 | 3 | 新增组件不涉及现有代码重构 |
| 开发体验 | 4 | 终端可见性提升调试效率 |

**Confidence**: 85% (高)
**Evidence**: blueprint:context-package.json#requirements[REQ-003, REQ-004]

### 3. Risk (风险) — Score: 3/5

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| node-pty 原生模块编译 | HIGH | MEDIUM | ConPTY 默认启用；提供 spawn fallback |
| PTY 进程泄漏 | HIGH | LOW | 复用 DelegateExecutor.stop() 模式 |
| EventBus 历史饱和 | MEDIUM | HIGH | 帧节流 + 环形缓冲区 |
| Claude Code CLI 协议不确定 | MEDIUM | MEDIUM | 先用 --print 模式验证 |
| 双向消息循环 | LOW | LOW | 独立 INPUT/OUTPUT 事件类型 |

**Confidence**: 78% (中高)
**Evidence**: cld-142911-59f0, explorations.json#risks

### 4. Complexity (复杂度) — Score: 3/5

| Factor | Score | Evidence |
|--------|-------|----------|
| 集成点数量 | 3 | 2 个新 Manager + 2 个新 Svelte 组件 + stores 扩展 |
| 依赖数量 | 3 | node-pty, xterm.js, marked.js (3 个新依赖) |
| 学习曲线 | 3 | xterm.js API 简单；node-pty 需要理解 PTY 概念 |
| 测试复杂度 | 3 | PTY 测试需要 mock；Dialog 测试可复用 DelegateExecutor 测试模式 |

**Confidence**: 82% (高)
**Evidence**: exploration-codebase.json#extension_points

### 5. Dependencies (依赖) — Score: 4/5

| Dependency | Type | Status | Risk |
|------------|------|--------|------|
| Phase 1 Foundation | 内部 | ✅ 已完成 | 无 |
| node-pty | npm | ⚠️ 需编译 | Windows ConPTY |
| @xterm/xterm | npm | ✅ 纯 JS | 无 |
| marked.js | npm | ✅ 纯 JS | 无 |
| Claude Code CLI | 外部 | ⚠️ 协议待验证 | --print 模式 |

**Confidence**: 85% (高)
**Evidence**: package.json, cld-142003-2a41#3

### 6. Alternatives (替代方案) — Score: N/A

| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| child_process.spawn (替代 node-pty) | 零额外依赖 | 无 PTY 语义、无 resize、交互程序异常 | ❌ 不适用于终端 |
| HTTP API (替代 CLI 子进程) | 标准化协议 | 需要 API key、网络依赖、延迟增加 | ❌ 违反本地优先约束 |
| 自定义 Canvas 渲染 (替代 xterm.js) | 完全控制 | 开发量巨大、ANSI 解析复杂 | ❌ 重复造轮子 |

**Confidence**: 90% (高)

## Dimension Summary

| Dimension | Score | Confidence | Key Evidence |
|-----------|-------|------------|-------------|
| Feasibility | 4/5 | 88% | M1 基础设施就绪，成熟库支持 |
| Impact | 5/5 | 85% | 核心差异化功能，直接解决用户痛点 |
| Risk | 3/5 | 78% | node-pty 编译 + PTY 泄漏可控 |
| Complexity | 3/5 | 82% | 3 新依赖，6 新组件，模式复用 |
| Dependencies | 4/5 | 85% | Phase 1 已完成，npm 依赖成熟 |
| Alternatives | N/A | 90% | 替代方案均有明显缺陷 |

## Risk Matrix

```
Impact
  HIGH │  R1 (node-pty 编译)
       │  R2 (PTY 泄漏)
       │
MEDIUM │  R3 (历史饱和)    R5 (CLI 协议)
       │  R4 (消息循环)
       │
   LOW │
       └──────────────────────────
         LOW      MEDIUM     HIGH
                Probability
```

## Go/No-Go Recommendation

**VERDICT: GO** ✅

**Confidence**: 82.75% (高)

**Rationale**:
- 架构基础充分：类型/事件已预留，WSGateway 零修改接入
- 模式复用：DialogManager 直接复用 DelegateExecutor 的 spawn/parse/emit
- 风险可控：所有 HIGH 风险有明确缓解措施
- 性能策略明确：帧节流 + 背压控制 + 环形缓冲区

**Conditions**:
1. 实现前验证 node-pty 在目标 Windows 版本的 ConPTY 兼容性
2. 实现前验证 Claude Code CLI 的 --print 模式行为
3. Phase 2 实现中包含帧节流（P0）和 ws.bufferedAmount 检查（P0）

## Confidence Summary

| Factor | Weight | Score | Contribution |
|--------|--------|-------|-------------|
| findings_depth | .30 | 0.85 | 25.5% |
| evidence_strength | .25 | 0.88 | 22.0% |
| coverage_breadth | .20 | 0.82 | 16.4% |
| user_validation | .15 | 0.75 | 11.25% |
| consistency | .10 | 0.85 | 8.5% |
| **Overall** | | | **83.65%** |

**Pressure Pass**: F-1 (类型/事件预留) 通过 4 步压力测试 ✅
**Residual Risks**: node-pty Windows 兼容性、Claude Code CLI 协议细节
