# Phase 3 集成问题列表

> **来源**: TASK-001 ~ TASK-006 代码审查、组件接口分析、数据流追踪
> **最后更新**: 2026-06-24
> **问题总数**: 16

---

## 优先级定义

| 级别 | 含义 | 处理策略 |
|------|------|----------|
| **P0** | 阻断性问题 — 功能不可用 | 必须立即修复，否则无法演示 |
| **P1** | 重要问题 — 影响体验或可靠性 | 演示前修复，或记录为 known issue |
| **P2** | 改进项 — 不影响核心功能 | 记录到后续迭代 backlog |

---

## 问题列表

### P0 — 阻断

#### BUG-001: `renderer/lib/electron-trpc.ts` 文件缺失

- **类型**: bug
- **来源**: TASK-002, TASK-003, TASK-004
- **描述**: 所有 UI 面板组件（KnowledgePanel、AnalysisPanel、CommandPalette）通过 `from "renderer/lib/electron-trpc"` 导入 tRPC 客户端，但 `apps/desktop/src/renderer/lib/electron-trpc.ts` 文件在当前 oh-my-maestro 仓库检出中不存在。该文件应在完整 Superset monorepo 中存在——它负责创建 `electronTrpc` 代理对象，将 tRPC query 通过 Electron IPC 发送到主进程。
- **影响**: 所有 UI 面板无法发起 tRPC 请求，数据获取功能完全不可用
- **修复方向**: 
  1. 确认 `electron-trpc.ts` 在 Superset monorepo 中的完整路径
  2. 该文件需要配置 `@trpc/react-query` 的 `createTRPCReact` + Electron IPC link
  3. 如果文件确实缺失，需创建并实现 Electron IPC → tRPC 的桥接
- **阻塞任务**: TASK-002, TASK-003, TASK-004

---

#### BUG-002: tRPC root 文件 (`apps/desktop/src/lib/trpc/index.ts`) 缺失

- **类型**: bug
- **来源**: TASK-001, TASK-002
- **描述**: maestro router 和 command-chain router 都使用 `from "../.."` 导入 `publicProcedure` 和 `router`，但 `apps/desktop/src/lib/trpc/index.ts` 在当前检出中不存在。该文件应导出 tRPC 核心类型（`router`、`publicProcedure`、`protectedProcedure` 等）。
- **影响**: tRPC router 定义无法编译通过
- **修复方向**: 创建 `apps/desktop/src/lib/trpc/index.ts`，参考 Superset API 端 tRPC 配置
- **阻塞任务**: TASK-001

---

#### BUG-003: `@modelcontextprotocol/sdk` 依赖未安装

- **类型**: bug
- **来源**: TASK-001
- **描述**: `maestro-mcp-provider.ts` 通过动态 `await import("@modelcontextprotocol/sdk/client/index.js")` 导入 MCP SDK，但当前环境未安装此 npm 包。虽然代码有优雅降级逻辑（降级到静态工具目录），但动态 MCP 握手功能不可用。
- **影响**: MCP provider 只能使用静态工具目录，无法动态发现 Maestro-flow 新增工具
- **修复方向**: 在 Superset monorepo 根目录执行 `bun add @modelcontextprotocol/sdk`
- **阻塞任务**: TASK-001

---

#### BUG-004: `@superset/mcp-v2` 工具注册模块不存在

- **类型**: bug
- **来源**: TASK-001
- **描述**: `maestro-mcp-provider.ts` 尝试通过 `await import("@superset/mcp-v2/tools/register")` 将工具注册到 Superset MCP Registry，但 `packages/mcp-v2/` 在当前检出中不存在。代码有降级处理（静默跳过注册），但工具不会出现在 Superset 全局 MCP 工具列表中。
- **影响**: Maestro 工具无法被 Superset 的 MCP-aware Agent 直接调用（仅可通过 tRPC endpoints 间接访问）
- **修复方向**: 确保完整 Superset monorepo 中包含 `packages/mcp-v2/` 包
- **阻塞任务**: TASK-001

---

### P1 — 重要

#### UX-001: CommandPalette 命令触发未接入终端执行

- **类型**: ux
- **来源**: TASK-004
- **描述**: `CommandPalette.handleSelect` 目前只构建 CLI 命令字符串并进行 `console.log`，实际终端执行逻辑未接入。代码中有 `TODO: Wave 3` 注释标记集成点。
- **影响**: 从命令面板选择命令后无法在终端中自动执行，用户需手动复制粘贴命令
- **修复方向**: 接入 Agent Launch API 或 `window.electronAPI?.terminalWrite()` 方法
- **阻塞任务**: TASK-004

---

#### UX-002: AnalysisPanel 无重试按钮

- **类型**: ux
- **来源**: TASK-003
- **描述**: `AnalysisPanel` 的 `ErrorState` 组件只显示错误消息，没有像 `KnowledgePanel` 那样提供重试按钮（`onRetry` 回调）。
- **影响**: 分析加载失败时用户无法一键重试，需切换面板再切回触发重新查询
- **修复方向**: 给 AnalysisPanel 的 ErrorState 添加 `onRetry` prop，调用 `refetch()`
- **阻塞任务**: TASK-003

---

#### UX-003: DecisionNodeView 没有决策选项交互 UI

- **类型**: ux
- **来源**: TASK-005
- **描述**: `DecisionNodeView` 渲染决策节点时展示 `question` 和 `options`，但具体交互方式（按钮点击、下拉选择）未在现有代码中完成实现。用户需要通过终端或其他方式确认决策。
- **影响**: 用户无法通过 UI 直接确认/选择决策节点，打断工作流体验
- **修复方向**: 在 DecisionNodeView 中添加可点击的选项按钮，选择后调用 Agent hooks 回调
- **阻塞任务**: TASK-005

---

#### BUG-005: WebSocket 端口 51742 在 Windows 上可能被占用

- **类型**: bug
- **来源**: TASK-005
- **描述**: Ralph 决策桥接使用硬编码端口 51742（基于 DESKTOP_NOTIFICATIONS_PORT 51741 + 1 推导），但该端口未经过 Windows 防火墙规则注册，可能被其他应用占用或被防火墙拦截。
- **影响**: WebSocket 连接失败，需依赖文件轮询降级方案
- **修复方向**: 添加端口可用性检测 + 自动选择备用端口逻辑
- **阻塞任务**: TASK-005

---

#### BUG-006: 3 个 tRPC endpoint 都依赖 `maestro` CLI 在 PATH 中

- **类型**: bug
- **来源**: TASK-001
- **描述**: tRPC maestro router 的三个 endpoint 都通过 `execFile("maestro", ...)` 执行 Maestro-flow CLI，依赖 `maestro` 命令在系统 PATH 中可用。如果 Maestro-flow 未安装或 PATH 配置错误，所有 tRPC 查询将失败并返回空结果。
- **影响**: 所有面板在无 Maestro-flow CLI 环境中无法获取数据
- **修复方向**: 添加 `which maestro` 预检 + 提供 Maestro-flow CLI 路径配置选项
- **阻塞任务**: TASK-001

---

### P2 — 改进

#### NIT-001: KnowledgePanel 和 AnalysisPanel 缺少单元测试文件

- **类型**: nit
- **来源**: TASK-002, TASK-003
- **描述**: `KnowledgePanel` 和 `AnalysisPanel` 没有对应的 `*.test.tsx` 单元测试文件。`CommandChainPanel` 有测试文件但仅做源码静态分析，未进行渲染测试。
- **影响**: 重构时缺乏回归测试保护
- **修复方向**: 在完整 Superset monorepo 中创建 React 渲染测试（vitest + react-testing-library）
- **阻塞任务**: 无

---

#### NIT-002: MCP Provider 工具目录未与 Maestro-flow 源码同步

- **类型**: nit
- **来源**: TASK-001
- **描述**: `MAESTRO_TOOL_CATALOG` 是手动维护的 29 个工具静态列表。如果 Maestro-flow 新增/删除/重命名工具，需手动同步更新此列表。MCP 动态握手是解决此问题的正确方向，但尚未可用。
- **影响**: 工具列表可能过时，新增的 Maestro-flow 命令不会自动出现
- **修复方向**: 实现 MCP 动态握手自动发现工具；或通过构建脚本从 Maestro-flow 源码自动生成工具目录
- **阻塞任务**: 无

---

#### NIT-003: AnalysisPanel 推荐列表缺少操作入口

- **类型**: nit
- **来源**: TASK-003
- **描述**: `AnalysisPanel` 渲染 `recommendations` 列表，但每个建议条目只是纯文本，没有 "执行"、"忽略" 等操作按钮。
- **影响**: 用户看到建议但无法从 UI 中直接操作
- **修复方向**: 为每个建议添加操作按钮（执行/忽略），连接 CommandPalette 命令触发
- **阻塞任务**: 无

---

#### NIT-004: CommandPalette 分类标题在空搜索时不显示计数

- **类型**: nit
- **来源**: TASK-004
- **描述**: `CommandPalette` 的 `groupCommands()` 使用 `CATEGORY_LABELS` 静态映射，剩余未在固定顺序中的分类标签显示原始 key（如 `"utility"` 而非 `"工具"`）。虽然有 `as keyof typeof CATEGORY_LABELS` 保护，但扩展新分类时需手动同步。
- **影响**: 对用户几乎无影响（目前 4 个分类已覆盖所有场景）
- **修复方向**: 将 categoryOrder 数组提取为常量 + 添加类型保护确保 CATEGORY_LABELS 覆盖所有分类
- **阻塞任务**: 无

---

#### NIT-005: WebSocketEventBus 无连接池限制

- **类型**: nit
- **来源**: TASK-005
- **描述**: `WebSocketEventBus` 接受任意客户端连接，没有连接数限制。在高并发或恶意连接场景下可能导致资源耗尽。
- **影响**: 桌面应用场景下风险极低（本地 localhost 通信），但代码健壮性可改进
- **修复方向**: 添加 `maxConnections` 配置参数（默认值如 10）
- **阻塞任务**: 无

---

#### NIT-006: 缺少统一的错误边界组件

- **类型**: nit
- **来源**: TASK-002, TASK-003, TASK-004
- **描述**: 所有面板各自实现了 ErrorState 组件（样式类似但不完全一致）。可抽取为共享 `ErrorState` 组件以减少重复代码。
- **影响**: 维护成本略高，需在 3+ 个文件中同步错误状态的样式变更
- **修复方向**: 创建 `renderer/components/shared/ErrorState.tsx`，参数化图标和消息
- **阻塞任务**: 无

---

#### NIT-007: 概念翻译层覆盖不完整

- **类型**: nit
- **来源**: TASK-002, TASK-004
- **描述**: `mapType()` 将后端类型 `wiki` 映射为 UI 类型 `knowhow`（丢失了 wiki 和 knowhow 的区分），`CATEGORY_LABELS` 将 `utility` 翻译为 "工具" 但该类工具实际包含心智模型和辅助功能。
- **影响**: 术语翻译精度可提升，但不影响功能
- **修复方向**: 审查并完善概念翻译映射表
- **阻塞任务**: 无

---

## 问题统计

| 分类 | P0 | P1 | P2 | 合计 |
|------|----|----|----|----|
| **bug** | 4 | 2 | 0 | 6 |
| **ux** | 0 | 3 | 0 | 3 |
| **nit** | 0 | 0 | 7 | 7 |
| **合计** | 4 | 5 | 7 | 16 |

---

## 修复优先级路线图

### 立即修复 (P0) — 4 项

1. **[BUG-001]** 确认/创建 `renderer/lib/electron-trpc.ts`
2. **[BUG-002]** 确认/创建 `lib/trpc/index.ts`
3. **[BUG-003]** 安装 `@modelcontextprotocol/sdk`
4. **[BUG-004]** 确认 `packages/mcp-v2/` 可用性

### 演示前修复 (P1) — 5 项

1. **[UX-001]** 接入 CommandPalette 终端执行
2. **[UX-002]** AnalysisPanel 添加重试按钮
3. **[UX-003]** DecisionNodeView 添加选项交互 UI
4. **[BUG-005]** WebSocket 端口可用性检测
5. **[BUG-006]** maestro CLI PATH 预检

### 后续迭代 (P2) — 7 项

记录到 v0.4.0 backlog，不在 Phase 3 范围内修复。
