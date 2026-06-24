# Maestro IDE

基于 Maestro-flow 编排内核的 GUI 工作流管理工具，面向非 CLI 习惯的开发者。

## 项目状态

| Milestone | 名称 | 状态 |
|-----------|------|------|
| M1 | MVP — Workflow Visualization | ✅ 已归档 |
| M2 | Usable — AI & Terminal | ✅ 已归档 |
| M3 | Refined — Trust & Polish | ✅ 已归档 |
| F1 | Foundation — 基础打通 | ✅ 已完成 |
| F2 | Orchestration — 编排可视化 | ✅ 已归档 |
| F3 | Deep Integration — 深度融合 | ✅ 已归档 |

**全部 6 个里程碑已完成。**

## 技术栈

- **桌面壳**: Electron 40+
- **前端**: React 19 + TypeScript + TanStack Router + Lucide Icons
- **RPC**: tRPC 11 (Electron IPC transport)
- **Schema**: Zod
- **构建**: electron-vite (ESM)
- **包管理**: bun
- **测试**: bun test
- **AI 编排**: Maestro-flow CLI (子进程集成)

## 项目结构

```
oh-my-maestro/
├── apps/desktop/                    # Electron 桌面应用
│   ├── src/
│   │   ├── main/                    # 主进程
│   │   │   ├── index.ts             # 应用入口 + 初始化编排
│   │   │   └── lib/
│   │   │       ├── agent-setup/     # Agent 集成 (MCP Provider, Ralph Bridge)
│   │   │       ├── command-chain-status-poller.ts
│   │   │       ├── terminal/        # 终端管理
│   │   │       └── websocket-event-bus.ts
│   │   ├── lib/trpc/               # tRPC 服务端 (共享层)
│   │   │   ├── index.ts            # initTRPC → router + publicProcedure
│   │   │   └── routers/
│   │   │       ├── index.ts        # AppRouter 类型 + createAppRouter
│   │   │       ├── command-chain/  # 命令链状态查询
│   │   │       └── maestro/        # KG 搜索 + 分析 + 命令列表
│   │   └── renderer/               # 渲染进程
│   │       ├── lib/
│   │       │   └── electron-trpc.ts # tRPC React 客户端
│   │       ├── components/
│   │       │   ├── KnowledgePanel/  # KG 搜索结果可视化
│   │       │   ├── AnalysisPanel/   # 6 维评分卡 + 风险矩阵
│   │       │   ├── CommandPalette/  # 20+ 高频 Maestro Command
│   │       │   └── CommandChainPanel/ # 命令链执行状态 + 决策节点
│   │       └── routes/             # TanStack Router 路由
│   └── package.json
├── e2e/                            # 端到端测试
│   └── phase3-full-flow.spec.ts    # 45 个测试用例
├── docs/phase3/                    # Phase 3 文档
│   ├── demo-script.md              # 演示脚本
│   └── integration-issues.md       # 集成问题列表
└── .workflow/                      # Maestro 工作流状态
    ├── state.json                  # 项目状态 + artifact 注册表
    ├── roadmap.md                  # 路线图
    ├── milestones/                 # 里程碑归档
    └── specs/                      # 知识沉淀
```

## 快速开始

### 前置条件

- [bun](https://bun.sh) >= 1.3.11
- [maestro-flow CLI](https://github.com/yangxiangnanwill/maestro-flow) (可选，MCP provider 会降级)

### 安装 & 运行

```bash
# 安装依赖
cd apps/desktop
bun install

# 启动开发模式
bun run dev

# 运行测试
bun test

# 运行 E2E 测试
bun test e2e/phase3-full-flow.spec.ts
```

## 核心功能

### 知识面板 (KnowledgePanel)
- KG 语义搜索，四态渲染 (Loading/Error/Empty/Data)
- 搜索结果卡片展示 (entityName + relevanceScore)

### 分析面板 (AnalysisPanel)
- 6 维评分卡 (可行性/复杂度/风险/团队能力/业务价值/紧急度)
- 5×5 风险矩阵热力图
- GO / CONDITIONAL_GO / NO-GO 总体判定

### 命令面板 (CommandPalette)
- 20+ 高频 Maestro Command，按 category 分组
- 实时搜索过滤 + 键盘导航
- 终端执行集成

### 命令链面板 (CommandChainPanel)
- 命令链执行状态实时展示
- Ralph 决策节点可视化 + 交互式选项

### MCP Provider
- Maestro-flow 28+ 工具注册为 MCP provider
- 三层降级策略: MCP handshake → 静态 catalog → try/catch fallback

## 架构决策

- **tRPC 分层**: `lib/trpc/index.ts` (server 端) + `renderer/lib/electron-trpc.ts` (client 端)
- **MCP 桥接**: Maestro-flow 作为独立 MCP Server 通过 stdio transport 注册
- **状态同步**: 文件轮询 (Phase 2) → WebSocket 事件推送 (Phase 3)
- **降级策略**: 外部依赖缺失时优雅降级，不阻断核心功能

## License

MIT
