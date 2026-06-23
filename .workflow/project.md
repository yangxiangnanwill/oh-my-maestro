# Maestro IDE

基于 maestro-flow 封装的 IDE-like 产品，面向非 CLI 习惯开发者。

## Context

### Current State

- **Milestone**: M3 — Refined — Trust & Polish (active)
- **Completed**: M1 — MVP — Workflow Visualization (2026-06-21), M2 — Usable — AI & Terminal (2026-06-22)
- **Next**: M3 Phase 3 — Trust & Polish

### M1 Summary

M1 交付了 Maestro IDE 的核心价值——工作流可视化编排 + 项目状态实时追踪。包含 CLI Adapter Layer、Delegate Executor、EventBus + WebSocket Gateway、State Sync Engine、Project Radar 和 Workflow Commander。83 个测试全部通过，TypeScript 编译零错误。

详见 `.workflow/milestones/M1/summary.md`

### M2 Summary

M2 在 M1 Foundation 基础上补全了交互能力——Terminal Bridge（node-pty + xterm.js 嵌入终端，多会话 Tab，双模式显示）+ AI Dialog（Claude Code CLI 子进程，NDJSON 流式输出，意图自动路由）。128/129 测试通过，tsc 零错误。9 条 learnings 已提取。

详见 `.workflow/milestones/M2/summary.md`

### Architecture

- **Stack**: SvelteKit + Hono + ws + chokidar
- **Pattern**: Event-driven (EventBus → WSGateway → Client stores)
- **Key Decisions**: CLI 子进程优先集成、事件驱动 + WebSocket、概念翻译层

### Key Decisions

1. 本地 Web 应用架构 (SA-01)
2. CLI 子进程优先集成 (SA-02)
3. 事件驱动 + WebSocket (SA-03)
4. Node.js + SvelteKit (SA-04)
5. 意图驱动交互 (UX-01)
6. 状态导向模式 (UX-02)
7. 概念翻译层 (UX-03)
