# Task: TASK-001 创建 AGENTS.md — Maestro-flow Monorepo 指南

## Implementation Summary

### Files Modified
- `D:/WorkSpace/VsCode/oh-my-maestro/AGENTS.md`: 将标题从 "Maestro IDE Monorepo Guide" 修正为 "Maestro-flow Monorepo Guide"，与任务规范一致。

### Content Added
- 文件已存在且内容完整，仅需微调标题以匹配任务规范。

### Existing Content (Verified)
- **标题**: Maestro-flow Monorepo Guide — 描述 Maestro IDE workspace 和 Maestro-flow 命令链编排系统
- **Question Tool 规则**: 保留 ask_user 工具使用说明
- **Structure 部分**: Bun monorepo，仅 apps/desktop + e2e
- **Tech Stack 部分**: Electron 40+、React 19、TailwindCSS、shadcn/ui、tRPC 11、electron-vite、bun、Maestro-flow CLI、TypeScript 严格模式、Biome
- **Common Commands 部分**: bun run dev、bun test、bun run typecheck、bun run build、bun run package
- **Agent Rules 部分**: 7 条规则，涵盖 Type safety、Maestro-flow CLI、tRPC IPC transport、MCP provider 降级策略、Plan & doc placement、lint 规范、Knowledge system gate rule
- **Project Structure 部分**: apps/desktop/ 完整目录树 + 4 条结构约定 + shadcn/ui 例外说明

## Outputs for Dependent Tasks

### Available Components
- `D:/WorkSpace/VsCode/oh-my-maestro/AGENTS.md` — 项目级 Agent 指南文件，所有后续任务中的 Agent 将自动读取此文件作为上下文。

### Integration Points
- **Agent 自动注入**: AGENTS.md 由 CLAUDE.md 通过 `@AGENTS.md` 引用，所有 Agent 会话自动加载。
- **Maestro-flow CLI 规则**: Agent Rules #2 和 #7 定义了 maestro CLI 的使用规范。
- **tRPC IPC transport 规则**: Agent Rules #3 定义了渲染进程与主进程通信规范。

## Status: COMPLETE

### Convergence Verification
| Criterion | Required | Actual | Status |
|-----------|----------|--------|--------|
| `Maestro` count | > 3 | 6 | PASS |
| `apps/desktop` count | > 2 | 4 | PASS |
| `superset` count | 0 | 0 | PASS |
| `electron-vite` count | > 0 | 2 | PASS |
