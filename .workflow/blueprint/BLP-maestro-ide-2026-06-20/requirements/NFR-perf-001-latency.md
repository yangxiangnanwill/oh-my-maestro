# NFR-PERF-001: Latency Performance Requirements

| Field | Value |
|-------|-------|
| **ID** | NFR-PERF-001 |
| **Category** | Performance - Latency |
| **Priority** | Must |
| **Trace** | F-005, F-003, F-004, S-002 |

## Description

Maestro IDE 作为实时交互式开发者工具，其用户体验直接取决于各交互面的响应延迟。本需求定义了三个关键延迟指标，覆盖状态同步、终端渲染和 AI 对话三个核心流式场景。这些指标源自 UX Expert 的 cross-cutting positions 和 System Architect 的约束定义。

## Requirements

### PERF-001-01: 状态同步延迟

State Sync Engine 的状态变更 MUST 在 500ms 内反映到 UI。具体分解：

- Event Bus MUST 在事件发布后 100ms 内将事件投递到所有已订阅的 WebSocket 客户端。
- 前端 MUST 在接收到 WebSocket 事件后 400ms 内完成状态更新和 UI 渲染。
- 活跃工作流的步骤状态变更 MUST 满足此 500ms 端到端延迟要求。
- 外部 CLI 变更检测延迟 SHOULD 不超过 5 秒，准确率 SHOULD 达到 99%。

> **Cross-Role Synergy (S-002)**: 500ms 延迟标准与 99% 准确率指标构成统一的验收标准集。

### PERF-001-02: 终端渲染延迟

Terminal Bridge 的 CLI 输出 MUST 在 PTY 产出数据后 100ms 内渲染到 xterm.js。

- xterm.js MUST 在收到 WebSocket 数据块后 30ms 内完成渲染。
- 终端 resize 事件 MUST 在 100ms 内传播到 PTY 进程。
- 长时间运行的进程 MUST NOT 因持续输出导致性能退化 -- 滚动和渲染 MUST 保持流畅。
- 终端输出 MUST 支持突发大量数据（如 `find / -type f`）而不丢失数据。

### PERF-001-03: AI 对话响应延迟

AI Dialog 的流式输出 MUST 展示及时的反馈信号。

- AI typing indicator MUST 在首个 token 到达后端后 200ms 内显示。
- 流式输出 MUST 在每个 token 到达后 50ms 内追加到对话界面。
- 面板切换（对话/工作流/终端）MUST 在 200ms 内完成，保留各面板的滚动位置和输入状态。
- 模式切换（简单/高级）SHOULD 在 200ms 内完成过渡。

### PERF-001-04: WebSocket 基础设施延迟

- WebSocket 连接 MUST 实现 30 秒间隔的心跳（ping/pong）以检测过期连接。
- WebSocket 网关 MUST 支持至少 10 个并发连接（单用户本地应用）。
- 新 WebSocket 连接时，网关 MUST 为每个通道重放最多 100 个近期事件，重放 MUST 在 500ms 内完成。
- 快照服务 MUST 每 30 秒在每个活跃通道上发布一次全量状态快照。

## Acceptance Criteria

1. 状态同步端到端延迟 MUST 满足 P95 < 500ms（活跃工作流步骤变更到 UI 渲染完成）。
2. 终端渲染延迟 MUST 满足 P95 < 100ms（PTY 输出到 xterm.js 渲染完成）。
3. AI 对话 typing indicator MUST 在首个 token 后 200ms 内出现，P99 < 300ms。
4. 所有延迟指标 MUST 在本地部署环境下达标（localhost WebSocket，无网络开销）。
5. 延迟指标 MUST 通过自动化性能测试持续验证，MUST NOT 仅依赖手动观察。

## Measurement Method

- **状态同步**: 在后端事件发布时间戳与前端渲染完成时间戳之间测量，使用 `performance.now()` 精度。
- **终端渲染**: 在 PTY 输出时间戳与 xterm.js 渲染回调时间戳之间测量。
- **AI 对话**: 在后端收到首个 Claude Code token 时间戳与前端 typing indicator 显示时间戳之间测量。
- **测试环境**: 本地部署，单用户，无额外负载。
