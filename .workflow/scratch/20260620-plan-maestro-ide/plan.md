---
session_id: maestro-20260620-184400
type: implementation-plan
phase: foundation
source_artifact: BLP-maestro-ide-2026-06-20
created_at: 2026-06-20T21:35:00+08:00
---

# Maestro IDE — Foundation Phase 实施计划

## 概述

本计划覆盖 **EPIC-001 Foundation**（State Sync Engine + Concept Translator），是所有后续 Epic 的前置依赖。

## 技术栈

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ≥20 |
| Language | TypeScript | 5.x |
| Backend Framework | Hono | latest |
| WebSocket | ws | 8.x |
| Frontend Framework | SvelteKit | 2.x |
| Terminal Emulator | xterm.js | 5.x |
| PTY | node-pty | 1.x |
| File Watcher | chokidar | 3.x |
| Build | Vite | 5.x |
| Package Manager | pnpm | 9.x |

## 项目结构

```
oh-my-maestro/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── svelte.config.js
├── src/
│   ├── lib/
│   │   ├── server/              # Backend core
│   │   │   ├── index.ts         # Hono app + WebSocket server
│   │   │   ├── event-bus.ts     # EventBus (pub/sub)
│   │   │   ├── ws-gateway.ts    # WebSocket gateway
│   │   │   ├── state-sync.ts    # State Sync Engine
│   │   │   ├── event-store.ts   # Event Store (SQLite)
│   │   │   ├── cli-adapter.ts   # CLI output parser adapter
│   │   │   ├── translator.ts    # Concept Translator middleware
│   │   │   └── types.ts         # Shared types
│   │   ├── client/              # Frontend core
│   │   │   ├── stores/          # Svelte stores
│   │   │   │   ├── connection.ts
│   │   │   │   ├── project-state.ts
│   │   │   │   └── display-mode.ts
│   │   │   └── services/
│   │   │       ├── ws-client.ts
│   │   │       └── translator.ts
│   │   └── shared/              # Shared types & constants
│   │       ├── events.ts
│   │       ├── translations.ts
│   │       └── types.ts
│   ├── routes/                  # SvelteKit routes
│   │   ├── +layout.svelte
│   │   └── +page.svelte
│   └── app.html
├── static/
└── tests/
    ├── server/
    │   ├── event-bus.test.ts
    │   ├── ws-gateway.test.ts
    │   ├── state-sync.test.ts
    │   └── translator.test.ts
    └── client/
        ├── stores.test.ts
        └── translator.test.ts
```

## Task 分解（按依赖排序）

### Wave 1: 项目脚手架 + 共享类型 (并行)

| Task ID | Title | Size | Dependencies | Story |
|---------|-------|------|-------------|-------|
| IMPL-001 | 初始化 SvelteKit 项目 + Hono 后端 | S | — | ST-001 |
| IMPL-002 | 定义共享类型和事件常量 | S | — | ST-001 |
| IMPL-003 | 配置 TypeScript + Vite + 测试框架 | S | IMPL-001 | ST-001 |

### Wave 2: EventBus + 翻译层 (并行)

| Task ID | Title | Size | Dependencies | Story |
|---------|-------|------|-------------|-------|
| IMPL-004 | 实现 EventBus (pub/sub) | M | IMPL-002 | ST-001 |
| IMPL-005 | 实现 Concept Translator 翻译注册表 | M | IMPL-002 | ST-004 |
| IMPL-006 | 实现 Concept Translator 中间件 | S | IMPL-004, IMPL-005 | ST-004 |

### Wave 3: WebSocket Gateway + State Sync (串行依赖)

| Task ID | Title | Size | Dependencies | Story |
|---------|-------|------|-------------|-------|
| IMPL-007 | 实现 WebSocket Gateway | L | IMPL-004 | ST-002 |
| IMPL-008 | 实现 State Sync Engine (双源合并) | L | IMPL-004, IMPL-007 | ST-001 |
| IMPL-009 | 实现 Event Store (SQLite 持久化) | L | IMPL-004 | ST-003 |

### Wave 4: 前端集成 + 端到端验证

| Task ID | Title | Size | Dependencies | Story |
|---------|-------|------|-------------|-------|
| IMPL-010 | 实现 Svelte stores (connection, project-state, display-mode) | M | IMPL-007 | ST-002, ST-005 |
| IMPL-011 | 实现前端 Concept Translator + display mode toggle | S | IMPL-005, IMPL-010 | ST-005 |
| IMPL-012 | 实现基础 UI 布局 (双栏 + 导航) | M | IMPL-010 | ST-006 |
| IMPL-013 | 端到端集成测试 | M | IMPL-008, IMPL-009, IMPL-011 | ST-001~ST-005 |

## 验收标准

- [ ] EventBus 发布/订阅工作正常，支持 typed events
- [ ] WebSocket 连接建立，断线自动重连
- [ ] State Sync Engine 合并 CLI 事件 + 文件系统事件，500ms 内推送
- [ ] Concept Translator 在 simple 模式下无术语泄漏
- [ ] 前端 display mode toggle 切换 simple/advanced
- [ ] 所有测试通过

## 执行策略

Wave 1 → Wave 2 (并行) → Wave 3 (串行) → Wave 4 (并行)
