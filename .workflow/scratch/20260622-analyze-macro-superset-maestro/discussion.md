# Discussion: Superset + Maestro-flow 兼容性宏分析

**Session ID**: ANL-superset-maestro-2026-06-22
**Date**: 2026-06-22
**Mode**: Macro (standalone)
**Topic**: 评估 Superset 能否基于 Maestro-flow 魔改，Superset 可视化 + Maestro-flow 内核替代 oh-my-maestro

## Table of Contents
- [User Intent](#user-intent)
- [Current Understanding](#current-understanding)
- [Round 1: Initial Exploration](#round-1-initial-exploration)
- [Confidence Tracking](#confidence-tracking)

## User Intent

原始意图：评估 Apache Superset (D:/WorkSpace/GitRepoes/superset) 能否与 Maestro-flow (D:/WorkSpace/Source/maestro-flow) 融合，用 Superset 的可视化/UI 能力 + Maestro-flow 的工作流编排内核替代当前 oh-my-maestro 项目。

核心问题：
1. Superset 和 Maestro-flow 在架构层面是否兼容？
2. 技术栈差异 (Bun+React vs Node+SvelteKit) 是否可以调和？
3. 功能映射：Superset 哪些功能可保留？Maestro-flow 哪些能力必须保留？
4. 融合方案的可行性和最优路径？
5. oh-my-maestro 项目的去留决策？

## Current Understanding

**经过 4 个并行探索 agent + 代码库深度分析后的综合理解：**

### Superset 架构核心发现
- **Monorepo 结构**：apps/admin (管理后台) + apps/api ( 后端) + apps/desktop (Electron 桌面应用)
- **Agent 系统**：支持 10 种 CLI Agent (Claude, Codex, Gemini, Cursor, Copilot, Droid, Amp, MastraCode, OpenCode, Pi)，每种有专门的 binary wrapper + hook 配置
- **MCP 协议**：通过 `/api/agent/[transport]` 端点暴露，支持 3 种认证方式 (session/API key/OAuth)
- **Worktree 隔离**：每个 task 获得独立的 git worktree + Neon DB branch + ElectricSQL container + 端口范围
- **UI 层**：React 19 + TailwindCSS v4 + shadcn/ui + xterm.js + CodeMirror + TipTap

### Maestro-flow 核心发现
- **编排引擎**：ChainGraph JSON schema (7 节点类型) + Ralph 协议 (status.json 驱动)
- **命令系统**：70+ 内置 command + 425+ skill（跨 .claude/.codex/.agents/.agy）
- **多 CLI 支持**：8 种 CLI Agent (Claude, Gemini, Qwen, Codex, OpenCode, Antigravity, Gemini A2A, Codex Server)
- **知识图谱**：tree-sitter WASM 多语言解析 + 语义搜索 + 可信度评分
- **扩展系统**：ExtensionLoader + Overlay 系统 + Hook 系统 + MCP 服务器

### 关键差异
| 维度 | Superset | Maestro-flow |
|------|----------|-------------|
| 定位 | Agent IDE (桌面应用) | 工作流编排框架 (CLI) |
| UI | Electron + React (成熟) | React/Ink TUI + Hono 浏览器仪表盘 |
| Agent 管理 | 原生 worktree 隔离 | 子进程 + tmux/wezterm |
| 编排能力 | 基础 (agent 指令) | 高级 (命令链 + 自适应决策) |
| 平台 | macOS only | Node.js 跨平台 |

### 融合判断
**两者不是竞争关系，而是互补关系**：
- Superset 缺编排引擎 → Maestro-flow 提供
- Maestro-flow 缺成熟 UI → Superset 提供
- 融合后形成完整产品：成熟的 Agent IDE + 强大的编排内核

