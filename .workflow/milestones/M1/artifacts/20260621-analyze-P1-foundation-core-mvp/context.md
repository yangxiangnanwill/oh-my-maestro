# Context: Phase 01 — Foundation + Core MVP

**Date**: 2026-06-21
**Areas discussed**: architecture, implementation, performance, security

## Decisions

### Decision 1: CLI Adapter Layer 为 Phase 1 最高优先级
- **Context**: 当前实现无法与 maestro-flow 交互——Workflow Commander 和 Project Radar 无数据源
- **Options**:
  1. 先实现 CLI Adapter 再做 UI（推荐）
  2. 先做 UI 用 mock 数据，后续接入
- **Chosen**: 先实现 CLI Adapter — 无真实数据源的 UI 是空壳
- **Reason**: CLI Adapter 是 maestro-flow 集成的唯一入口，阻塞所有下游功能

### Decision 2: MVP 阶段 per-client 翻译性能可接受
- **Context**: WSGateway.broadcastEvent 对每客户端做 payload 翻译，O(n) 复杂度
- **Options**:
  1. 接受单用户场景下的 O(n) 开销（推荐）
  2. 预计算按 mode 分组的缓存 payload
- **Chosen**: 接受 O(n) — MVP 单用户 <10 客户端，性能影响可忽略
- **Reason**: 预计算缓存增加复杂度，MVP 阶段不必要

### Decision 3: Windows ConPTY 风险延迟到 Phase 2
- **Context**: node-pty Windows 兼容性问题（SIGTSTP 不可靠、resize 错误）
- **Options**:
  1. Phase 1 就做 Windows 兼容（成本高）
  2. Phase 1 用 child_process.spawn 代替 PTY，Phase 2 再引入 node-pty
- **Chosen**: Phase 1 用 child_process.spawn — Terminal Bridge（需要 PTY）在 Phase 2
- **Reason**: Phase 1 不需要交互式终端，spawn 足够处理 delegate 输出

## Constraints

### Locked
- 架构分层：EventBus → WSGateway → StateSync → Translator，不可跨层调用
- SvelteKit 前端 + Hono 后端 + ws WebSocket（ADR-001/003）
- CLI 子进程集成策略（ADR-002）— 先 subprocess，后 API
- 概念翻译必须覆盖所有用户可见文本（UX-01）

### Free
- CLI Adapter 版本检测策略的具体实现（注册表 vs 简单 if-else）
- Project Radar 的状态树组件选型（Svelte 自建 vs 第三方 tree 组件）
- Workflow Commander 的分类 UI（卡片 vs 列表 vs 命令面板）
- WS 消息格式中 payload 的嵌套深度

### Deferred
- Terminal Bridge 的 xterm.js + node-pty 集成（Phase 2）
- AI Dialog 的 Claude Code 对话界面（Phase 2）
- Approval Gate 的 diff 预览组件（Phase 3）
- VS Code extension 构建（v0.4.0+）

## Code Context
- `src/lib/server/event-bus.ts:22` — EventBus 核心，所有事件经过此处
- `src/lib/server/ws-gateway.ts:124` — broadcastEvent() per-client 翻译热路径
- `src/lib/server/state-sync.ts:38` — StateSyncEngine 双源合并入口
- `src/lib/shared/translations.ts:22` — TRANSLATIONS 注册表，10 术语
- `maestro-flow/src/ralph/cmd-skills.ts:15` — `ralph skills --json` NDJSON 输出格式
- `maestro-flow/src/async/delegate-broker.js:558` — SqliteDelegateBroker 事件持久化
