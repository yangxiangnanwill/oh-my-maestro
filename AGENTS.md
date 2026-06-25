# Maestro-flow Monorepo Guide

You're running inside a Maestro IDE workspace — an Electron desktop application that orchestrates AI-powered workflow management. "Workflow" in any user message refers to Maestro-flow's command chain orchestration system.

## Question Tool

When you need to ask the user ANY question — including simple yes/no, confirmations, and clarifications — ALWAYS use the `ask_user` tool. Never ask questions in plain text. The Maestro UI renders `ask_user` calls as an interactive overlay with clickable option buttons; plain-text questions will not be surfaced to the user in the same way.

Guidelines for agents and developers working in this repository.

## Structure

Bun monorepo with:
- **Apps**:
  - `apps/desktop` - Electron desktop application (main + renderer + preload)
- **Tooling**:
  - `e2e` - End-to-end tests

## Tech Stack

- **Package Manager**: Bun (no npm/yarn/pnpm)
- **Desktop Framework**: Electron 40+
- **Build System**: electron-vite
- **Frontend**: React 19 + TailwindCSS + shadcn/ui
- **IPC**: tRPC 11 (Electron IPC transport)
- **Orchestration**: Maestro-flow CLI (子进程执行)
- **State Sync**: WebSocket event bus + 文件轮询 fallback
- **Type Safety**: TypeScript 严格模式
- **Code Quality**: Biome (formatting + linting)

## Common Commands

```bash
# Desktop Development
cd apps/desktop
bun run dev                    # Start electron-vite dev server
bun test                       # Run tests
bun run typecheck              # Type check

# Build & Package
bun run build                  # Build desktop app
bun run package                # Package with electron-builder
```

## Agent Rules

1. **Type safety** - avoid `any` unless necessary
2. **Maestro-flow CLI** - use `maestro` CLI for orchestration tasks (search, delegate, explore, ralph). The CLI runs as a Node.js subprocess in the Electron main process.
3. **tRPC IPC transport** - renderer ↔ main process communication goes through tRPC routers in `src/lib/trpc/routers/`. Never use `ipcRenderer.invoke` directly — always use the tRPC client.
4. **MCP provider 降级策略** - Maestro MCP provider 在 CLI 不可用时自动降级为文件轮询模式。Agent setup 中注册的 MCP tools 通过 `maestro-mcp-provider.ts` 桥接。
5. **Plan & doc placement** - implementation plans go in `plans/` (cross-cutting) or `apps/desktop/plans/` (desktop-scoped); shipped plans move to `plans/done/`. Architecture/reference docs go in `apps/desktop/docs/`. Never drop `*_PLAN.md` at an app root or inside `src/`.
6. **Always fix lint warnings before pushing** - CI fails on Biome warnings, not just errors. Run `bun run lint:fix` after edits and verify `bun run lint` exits 0 before `git push`.
7. **Knowledge system gate rule** - On any coding/modification/debugging task, run `maestro search` + `maestro load` BEFORE reading code or editing files.

---

## Project Structure

All projects in this repo should be structured like this:

```
apps/desktop/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口：app 生命周期 + MCP 注册
│   │   ├── lib/                 # 主进程模块
│   │   │   ├── agent-setup/     # Agent 包装器 + MCP provider
│   │   │   ├── terminal/        # PTY 终端管理
│   │   │   └── ...
│   │   ├── host-service/        # 本地 HTTP 服务
│   │   ├── terminal-host/       # 终端守护进程
│   │   └── windows/             # 窗口管理
│   ├── preload/                 # Electron preload 脚本
│   │   └── index.ts
│   ├── renderer/                # React 前端
│   │   ├── components/          # UI 组件
│   │   │   ├── AnalysisPanel/   # 分析面板（6 维评分 + 风险矩阵）
│   │   │   ├── CommandChainPanel/ # 命令链步骤进度
│   │   │   ├── CommandPalette/  # 命令面板
│   │   │   └── KnowledgePanel/  # 知识面板
│   │   ├── contexts/            # React Context
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── lib/                 # 渲染端工具
│   │   ├── providers/           # Provider 组件
│   │   ├── routes/              # 路由页面
│   │   └── index.tsx            # 渲染入口
│   └── lib/                     # 共享层
│       ├── electron-app/        # Electron 应用工厂
│       └── trpc/                # tRPC 路由定义
├── package.json
├── electron.vite.config.ts
└── electron-builder.ts
```

1. **One folder per component**: `ComponentName/ComponentName.tsx` + `index.ts` for barrel export
2. **Co-locate by usage**: If used once, nest under parent's `components/`. If used 2+ times, promote to **highest shared parent's** `components/`
3. **One component per file**: No multi-component files
4. **Co-locate dependencies**: Utils, hooks, constants, config, tests live next to the file using them

### Exception: shadcn/ui Components

The `src/renderer/components/ui/` directory contains shadcn/ui components. These use **kebab-case single files** (e.g., `button.tsx`, `base-node.tsx`) instead of the folder structure above. This is intentional—shadcn CLI expects this format for updates via `bunx shadcn@latest add`.
