# Superset → Oh My Maestro 概念映射

> **Round 1 产物** — 基于 Superset 产品概念和当前 Electron 壳架构分析。
> **硬性约束**: 不引入 Superset runtime、不引入 Superset 后端、不做 auth/permissions。
> **待 Codex Review**: 映射是否导致 runtime 依赖蔓延、MVP 最小概念集。

## Superset 核心概念

Apache Superset 是数据探索和可视化平台，核心产品抽象：

| 概念 | Superset 定义 | 用户价值 |
|------|-------------|---------|
| **Dashboard** | 可组合的图表集合，支持布局、过滤、全局参数 | 一页总览全局状态 |
| **Chart** | 单个可视化组件（折线/柱状/表/饼等），绑定 Dataset | 单维度深入理解 |
| **Dataset** | 数据源定义（SQL table/view 或 virtual），含列元数据 | 统一数据入口 |
| **Explore** | 交互式数据探索器，拖拽维度+度量 → 实时生成 Chart | 零代码探索数据 |
| **Saved Query** | 保存的 SQL 查询，可复用、可分享 | 重复执行标准查询 |
| **Filter State** | Dashboard 级别全局过滤器，联动所有 Chart | 统一筛选上下文 |

## Oh My Maestro 概念映射

### 直接映射（概念等价）

| Superset | Oh My Maestro | 映射理由 |
|----------|--------------|---------|
| Dashboard | **Workspace Overview** | 工作区总览页面，展示项目状态、活跃 chain、知识图谱快照。对应当前 `_dashboard/page.tsx` |
| Chart | **Widget** | 单个可视化组件：命令链步骤进度、6 维评分雷达图、知识搜索结果列表。对应当前 `CommandChainPanel`、`AnalysisPanel`、`KnowledgePanel` |
| Dataset | **Command Output Source** | CLI 命令输出的标准化数据源。每个 read 命令产生一种 Dataset：`ralph-session` → Session Dataset，`knowledge-search` → SearchResult Dataset |
| Explore | **Command Output Explorer** | 交互式探索 CLI 输出：选择命令 → 填参数 → 查看结构化结果。对应当前 `CommandPalette` 的功能扩展 |
| Saved Query | **Command Preset** | 保存的命令+参数组合，可一键重新执行。如 `maestro search "topology" --kg` 保存为 "搜索拓扑知识" |
| Filter State | **Context Filter** | 项目/工作区/session/时间范围过滤，联动 Dashboard 上所有 Widget |

### 概念适配（Maestro 特有，Superset 无等价）

| Oh My Maestro 概念 | 描述 | Superset 近似 |
|--------------------|------|--------------|
| **Command Chain** | 多步骤编排的命令序列（ralph/coordinate 驱动） | 无直接等价，接近 Dashboard 的"动作流" |
| **Ralph Session** | 有状态的步骤驱动会话（status.json 跟踪） | 无等价，接近"运行中的 Dashboard 版本" |
| **Knowledge Graph** | 代码+文档+术语的多层知识图谱 | 接近 Dataset 的"元数据视图" |
| **Agent Chat** | AI 对话界面（Claude/Anthropic SDK） | 无等价 |
| **Terminal** | 嵌入式 PTY 终端 | 无等价 |

### 明确排除的概念（MVP 不引入）

| Superset 概念 | 排除理由 |
|--------------|---------|
| SQL Lab | Maestro 不涉及 SQL 查询 |
| Row-level Security | MVP 无 auth 需求 |
| Alerts/Reports | 需要 Superset 后端 scheduler |
| Cache Layer | 需要 Redis/Superset 后端 |
| Database Connection | Maestro 不连接外部数据库 |
| Semantic Layer | Maestro 的数据源是 CLI 输出，不是 SQL |

---

## 当前 Electron 壳 → 概念映射落地

基于 cli-explore-agent 分析的当前架构，映射到 Superset-inspired 产品结构：

### 现有组件 → Widget 映射

| 现有组件 | 当前功能 | 映射为 Widget | 数据源 (Dataset) |
|---------|---------|-------------|-----------------|
| `CommandChainPanel` | 命令链步骤进度 + 决策节点 | ChainProgress Widget | `commandChain.getStatus` → status.json |
| `KnowledgePanel` | 知识搜索 + 结果列表 | KnowledgeSearch Widget | `maestro.knowledge.search` → CLI stdout |
| `AnalysisPanel` | 6 维评分 + 风险矩阵 | AnalysisRadar Widget | `maestro.analyze.result` → CLI JSON |
| `CommandPalette` | 命令搜索 + 分组 | CommandExplorer Widget | `maestro.commands.list` → MAESTRO_TOOL_CATALOG |
| `ChatPanel` | AI 对话 | Chat Widget | `chatService.send` → Anthropic SDK |
| `TerminalPanel` | PTY 终端 | Terminal Widget | `terminal.createOrAttach` → PTY daemon |

### 当前页面 → Dashboard 映射

| 当前页面 | 映射为 Dashboard | 包含的 Widgets |
|---------|-----------------|---------------|
| `_dashboard/page.tsx` | Workspace Dashboard | WorkspaceCards + RightSidePanel(ChainProgress + KnowledgeSearch) |
| `workspaces/$workspaceId/page.tsx` | Workspace Detail | Chat + Terminal (split mode) |

### 缺失的 Dashboard/Widget（MVP 应补全）

| 需新增 | 对应 Superset 概念 | 数据源 | 优先级 |
|-------|--------------------|-------|--------|
| Project Status Dashboard | Dashboard | `manage-status` CLI / state.json | P0 |
| Ralph Session Dashboard | Dashboard | `ralph-session` / `ralph-check` | P0 |
| Command Output Explorer | Explore | 任意 read 命令 → 结构化输出 | P1 |
| Command Preset Panel | Saved Query | 本地存储（localStorage / TanStack DB） | P2 |
| Context Filter Bar | Filter State | 当前 workspace/project 上下文 | P1 |

---

## Dataset 定义（CLI 输出 → 结构化数据源）

每个 read 命令对应一个 Dataset 定义：

```ts
interface CommandOutputDataset {
  commandId: string;           // 关联的 CommandDefinition.id
  schema: ZodSchema;           // 输出结构定义
  fetch: (args: Record<string, string>) => Promise<z.infer<typeof schema>>;
  sampleData?: unknown;        // mock 数据（CLI 不可用时降级）
}
```

### MVP Dataset 清单

| Dataset ID | 命令 | Schema 摘要 |
|------------|------|------------|
| `ralph-skills` | `ralph skills --platform claude --json` | `{ skills: Array<{name, type, scope, hint}> }` |
| `ralph-check` | `ralph check --json` | `{ status, warnings, errors }` |
| `ralph-session` | `ralph session --json` | `{ session, status, lifecycle, phase, milestone, progress }` |
| `knowledge-search` | `maestro search <query> --json` | `{ results: Array<{id, title, type, score, snippet}> }` |
| `knowledge-load` | `maestro load --type spec --category arch` | 文本（需 parser） |
| `command-chain-status` | (直接读 status.json) | `{ chains: Array<CommandChainStep> }` |
| `project-status` | `maestro manage-status` | 文本（需 parser） |
| `workspace-list` | (tRPC workspaces.getAllGrouped) | `{ groups: Array<WorkspaceGroup> }` |

---

## 架构边界：不引入 Superset runtime 的保证

| 可能的 Runtime 依赖蔓延路径 | 隔离措施 |
|---------------------------|---------|
| 引入 Superset 前端组件库 | ❌ 不引入。Widget 用 React + shadcn/ui 自建 |
| 需要 Superset REST API | ❌ 不引入。数据源全部走 tRPC → CLI execFile |
| 需要 Superset 后端（Python） | ❌ 不引入。主进程 Node.js 直接执行 CLI |
| 需要 Redis 缓存层 | ❌ 不引入。用 TanStack Query 缓存 + IndexedDB 持久化 |
| 需要数据库连接 | ❌ 不引入。数据源是 CLI 输出和本地 JSON 文件 |
| Dashboard 布局引擎 | ✅ 借鉴概念。用 React Grid Layout 或自定义 flex 布局 |
| Filter 联动机制 | ✅ 借鉴概念。用 React Context + URL state 同步 |

---

## 需 Codex Review 的点

1. **概念映射是否过度** — 6 个 Superset 概念映射到 Maestro 是否自然？是否有强行映射的成分？
2. **Widget 拆分粒度** — 当前 `CommandChainPanel` 是否应拆为 ChainProgress + DecisionNodes 两个 Widget？
3. **Dataset schema 定义时机** — Round 1 只定义接口和清单，Round 3 才实现 parser。是否应在 Round 2 就锁定 schema？
4. **Command Output Explorer 的 MVP 形态** — 是做 CommandPalette 的增强版，还是独立页面？
5. **Filter State 的存储** — localStorage vs TanStack DB vs URL state，哪个是 MVP 最佳选择？
6. **Command Preset** — Round 4 才需要？还是 Round 2 Command Registry 就应预留 preset 概念？
7. **"不引入 Superset runtime" 的边界测试** — 如果 Dashboard 需要 drag-and-drop 布局，引入 `react-grid-layout` 算不算引入 runtime 依赖？（答案：不算，它是纯前端布局库，没有后端依赖。但需要确认。）
