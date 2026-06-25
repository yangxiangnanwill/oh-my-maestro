# Developing Maestro IDE

This guide is for contributors building Maestro IDE from source.

## Prerequisites

| Tool | Install |
|:-----|:--------|
| [Bun](https://bun.sh/) (v1.0+) | `curl -fsSL https://bun.sh/install \| bash` |
| Git 2.20+ | `winget install Git.Git` (Windows) |

Windows is the primary supported platform.

## Quick Start

```bash
git clone https://github.com/yangxiangnanwill/oh-my-maestro.git
cd oh-my-maestro/apps/desktop
bun install
bun run dev
```

## Project Structure

```
oh-my-maestro/
├── apps/
│   └── desktop/              # Electron desktop application
│       ├── src/
│       │   ├── main/         # Electron 主进程
│       │   ├── preload/      # Preload 脚本
│       │   ├── renderer/     # React 前端
│       │   └── lib/          # 共享层（tRPC 路由等）
│       ├── package.json
│       ├── electron.vite.config.ts
│       └── electron-builder.ts
├── e2e/                      # End-to-end tests
└── docs/                     # Documentation
```

## Development Workflow

### Start Desktop App

```bash
cd apps/desktop
bun run dev
```

This starts the electron-vite dev server with hot reload for both main and renderer processes.

### Run Tests

```bash
cd apps/desktop
bun test
```

### Type Check

```bash
cd apps/desktop
bun run typecheck
```

### Build

```bash
cd apps/desktop
bun run build
```

## Architecture

- **Electron Main Process** (`src/main/`): Manages windows, PTY sessions, agent setup, and Maestro-flow CLI subprocess
- **Preload** (`src/preload/`): Bridges main ↔ renderer via contextBridge
- **Renderer** (`src/renderer/`): React 19 frontend with tRPC IPC communication
- **Shared Layer** (`src/lib/`): tRPC router definitions shared between main and renderer

## Key Technologies

- **IPC**: tRPC over Electron IPC transport (not HTTP)
- **Terminal**: node-pty + xterm.js for embedded terminal
- **Orchestration**: Maestro-flow CLI as Node.js subprocess
- **State Sync**: WebSocket event bus + file polling fallback
