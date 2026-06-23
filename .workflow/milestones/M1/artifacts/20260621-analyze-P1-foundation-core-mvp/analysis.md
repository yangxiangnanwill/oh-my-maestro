---
session_id: ANL-P1-foundation-core-mvp-2026-06-21
type: analysis
phase: 1
milestone: M1
created_at: 2026-06-21T09:35:00+08:00
---

# Phase 1 Analysis — Foundation + Core MVP

## Executive Summary

Phase 1 的技术可行性为 **CONDITIONAL GO**——架构设计合理、核心模块已有可运行实现，但存在 3 个中等风险需在 plan 阶段明确处理：CLI 适配器层尚未实现、WebSocket Gateway 的 `broadcastEvent` 对每客户端做 payload 深拷贝+翻译可能有性能瓶颈、maestro-flow 集成点（ralph skills NDJSON、delegate broker）尚未对接。建议进入 plan 阶段时优先处理这 3 项。

## Dimension Scores

| Dimension | Score | Confidence | Key Evidence |
|-----------|-------|------------|-------------|
| Feasibility | 4/5 | 85% | EventBus/WSGateway/StateSync 已实现可运行；CLI 适配器和 maestro 集成尚缺失 |
| Impact | 5/5 | 95% | 工作流编排+状态可视化直接命中核心痛点（PM-03），用户价值明确 |
| Risk | 3/5 | 80% | CLI 输出格式变更可破坏适配器；WS per-client 翻译有性能隐患；Windows ConPTY 未验证 |
| Complexity | 3/5 | 75% | 双源状态合并+概念翻译+CLI 适配器三横切关注点交叉，集成复杂度中等偏高 |
| Dependencies | 3/5 | 80% | 依赖 maestro-flow CLI 二进制稳定可用；better-sqlite3 native 编译；node-pty Windows 兼容性 |
| Alternatives | N/A | N/A | VS Code extension / Tauri / Electron 已在 ADR-001 评估并排除 |

## Per-Dimension Analysis

### Feasibility (4/5, 85%)

**Strengths**:
- EventBus pub/sub 模式成熟，6 测试全通过（anchor-1）
- WebSocket Gateway 消息路由实现完整，支持 subscribe/unsubscribe/set-mode（anchor-2）
- StateSyncEngine 双源合并逻辑清晰，100ms debounce 合理（anchor-3）
- Concept Translator 10 术语覆盖 guidance §2 全部术语，12 测试通过（anchor-4）
- Svelte stores + WSClient 自动重连机制完备（anchor-5）

**Gaps**:
- CLI Adapter Layer（SA-06）尚未实现——当前无法解析 `maestro ralph skills --json` NDJSON 输出
- `maestro delegate` 子进程管理尚未实现——无法实际触发工作流执行
- Project Radar 无数据源——`.workflow/state.json` 读取逻辑缺失
- Workflow Commander 无工作流目录——`GET /api/workflows` 端点缺失

**Confidence factors**: findings_depth=0.30×0.9=0.27, evidence_strength=0.25×0.85=0.21, coverage_breadth=0.20×0.85=0.17, user_validation=0.15×0.7=0.105, consistency=0.10×0.95=0.095 → **85%**

### Impact (5/5, 95%)

**Direct value**:
- 工作流编排+状态可视化是 PM-03 定义的 MVP 核心价值
- 概念翻译层消除非 CLI 用户最大认知负担（UX-01）
- 4 个成功标准均为用户可直接感知的改进

**Confidence factors**: findings_depth=0.30×1.0, evidence_strength=0.25×0.95, coverage_breadth=0.20×0.90, user_validation=0.15×0.95, consistency=0.10×0.95 → **95%**

### Risk (3/5, 80%)

**Identified risks**:

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| CLI output format change breaks adapter | Medium | High | Versioned adapter registry + startup version detection (findings-cli-adapter-versioning) |
| WS per-client translation O(n) per event | Medium | Medium | Batch translation or cache translated payloads by mode |
| node-pty Windows conpty instability | Medium | Medium | Platform-specific PTY control strategies (findings-windows-conpty-stability) |
| Concept translation leak in error paths | Low | High | Defensive rendering layer + catch-all error container (findings-concept-abstraction-leak) |
| State sync desync under concurrent CLI+GUI ops | Medium | Medium | Dual-source model with externallyTriggered flag (findings-cli-state-desync) |

**Confidence factors**: findings_depth=0.30×0.85, evidence_strength=0.25×0.75, coverage_breadth=0.20×0.80, user_validation=0.15×0.70, consistency=0.10×0.90 → **80%**

### Complexity (3/5, 75%)

**Integration points**: 6 channels × 20+ event types × 2 display modes = 复杂组合空间
**Cross-cutting concerns**: EventBus + StateSync + Translator 三者交叉，每个 WS 消息经过三层处理
**Test coverage**: 18/18 测试通过，但仅覆盖 EventBus 和 Translator，WSGateway/StateSync/Server 无测试

**Confidence factors**: findings_depth=0.30×0.75, evidence_strength=0.25×0.70, coverage_breadth=0.20×0.75, user_validation=0.15×0.70, consistency=0.10×0.85 → **75%**

### Dependencies (3/5, 80%)

**External dependencies**:
- `maestro-flow` CLI 二进制（路径发现、版本检测、输出格式稳定性）
- `better-sqlite3` native 编译（已在 package.json 但未使用）
- `node-pty` native 编译（Phase 2 需求，Phase 1 不涉及）
- `ws` library 稳定性（成熟库，风险低）

**Internal dependencies**:
- EventBus → WSGateway → WSClient 链路依赖（单点故障：EventBus 崩溃则全系统停）
- TranslatorMiddleware 作为 WSGateway 和 StateSync 的横切依赖

**Confidence factors**: findings_depth=0.30×0.80, evidence_strength=0.25×0.75, coverage_breadth=0.20×0.80, user_validation=0.15×0.80, consistency=0.10×0.85 → **80%**

## Risk Matrix

| | Low Impact | Medium Impact | High Impact |
|---|-----------|--------------|-------------|
| **High Probability** | — | — | — |
| **Medium Probability** | — | WS translation perf | CLI adapter breakage |
| **Low Probability** | — | Translation leak | ConPTY crash |

## Go/No-Go Recommendation

**CONDITIONAL GO** — 整体评分 3.6/5，架构设计合理但实现不完整。

**Conditions for GO**:
1. CLI Adapter Layer 必须在 Phase 1 plan 中作为 Wave 1 优先实现
2. WS Gateway 翻译性能需基准测试（目标：100 客户端 × 10 events/sec < 5ms per event）
3. maestro-flow 集成测试需覆盖 `ralph skills --json` 输出解析
4. WSGateway 和 StateSyncEngine 需补充单元测试

**Overall confidence**: 83%
