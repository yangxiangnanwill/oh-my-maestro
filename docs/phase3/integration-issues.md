# Phase 3 集成问题列表

> **来源**: TASK-001 ~ TASK-006 代码审查、组件接口分析、数据流追踪
> **最后更新**: 2026-06-24
> **问题总数**: 16 | **已修复**: 8 | **待修复**: 8

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

#### ✅ BUG-001: `renderer/lib/electron-trpc.ts` 文件缺失 — **已修复 (GAP-001)**

- **类型**: bug
- **来源**: TASK-002, TASK-003, TASK-004
- **描述**: ~~所有 UI 面板组件通过 `from "renderer/lib/electron-trpc"` 导入 tRPC 客户端，但文件不存在。~~
- **修复**: 创建 `apps/desktop/src/renderer/lib/electron-trpc.ts`，使用 `createTRPCReact<AppRouter>()` 创建类型安全的 React hooks 客户端
- **提交**: `9a92d1e`

---

#### ✅ BUG-002: tRPC root 文件 (`apps/desktop/src/lib/trpc/index.ts`) 缺失 — **已修复 (GAP-002)**

- **类型**: bug
- **来源**: TASK-001, TASK-002
- **描述**: ~~maestro router 和 command-chain router 都使用 `from "../.."` 导入 `publicProcedure` 和 `router`，但文件不存在。~~
- **修复**: 创建 `apps/desktop/src/lib/trpc/index.ts`，使用 `initTRPC.create()` 初始化 tRPC，导出 `router` 和 `publicProcedure`
- **提交**: `c48f1ac`

---

#### ✅ BUG-003: `@modelcontextprotocol/sdk` 依赖未安装 — **已修复 (GAP-003)**

- **类型**: bug
- **来源**: TASK-001
- **描述**: ~~MCP SDK 未安装，动态 MCP 握手功能不可用。~~
- **修复**: 创建 `apps/desktop/package.json`，声明依赖并执行 `bun install`，安装 `@modelcontextprotocol/sdk@1.29.0`
- **提交**: `2cb3aad`

---

#### ✅ BUG-004: `@superset/mcp-v2` 工具注册模块不存在 — **已确认降级 (GAP-004)**

- **类型**: bug
- **来源**: TASK-001
- **描述**: ~~`packages/mcp-v2/` 在当前检出中不存在。~~
- **修复**: 确认 `tryRegisterToSupersetRegistry()` 已有 try/catch 降级逻辑，缺失时使用静态 tool catalog。在完整 Superset monorepo 环境中自动启用
- **提交**: `2cb3aad`

---

### P1 — 重要

#### ✅ UX-001: CommandPalette 命令触发未接入终端执行 — **已修复 (GAP-006)**

- **类型**: ux
- **来源**: TASK-004
- **描述**: ~~`handleSelect` 只有 `console.log`，实际终端执行逻辑未接入。~~
- **修复**: 移除 TODO 注释，接入 `electronAPI.terminalWrite()` 优先，fallback `electronAPI.send("terminal:execute", ...)`
- **提交**: `eca123a`

---

#### ✅ UX-002: AnalysisPanel 无重试按钮 — **已修复 (GAP-007)**

- **类型**: ux
- **来源**: TASK-003
- **描述**: ~~`ErrorState` 组件只显示错误消息，没有重试按钮。~~
- **修复**: 添加 `onRetry` prop + 重试按钮，使用 `refetch()` 作为回调
- **提交**: `ac06bd2`

---

#### ✅ UX-003: DecisionNodeView 没有决策选项交互 UI — **已修复 (GAP-008)**

- **类型**: ux
- **来源**: TASK-005
- **描述**: ~~`DecisionNodeView` 渲染决策节点时缺少交互方式。~~
- **修复**: 添加 `onSelectOption` prop，未决策选项渲染为 `<button>` 带 `onClick` + `cursor-pointer` + hover/focus 样式
- **提交**: `cc3baf7`

---

#### BUG-005: WebSocket 端口 51742 在 Windows 上可能被占用

- **类型**: bug
- **来源**: TASK-005
- **描述**: Ralph 决策桥接使用硬编码端口 51742，未经过 Windows 防火墙规则注册。
- **影响**: WebSocket 连接失败，需依赖文件轮询降级方案
- **修复方向**: 添加端口可用性检测 + 自动选择备用端口逻辑
- **阻塞任务**: TASK-005

---

#### ✅ BUG-006: 3 个 tRPC endpoint 都依赖 `maestro` CLI 在 PATH 中 — **已修复 (GAP-005)**

- **类型**: bug
- **来源**: TASK-001
- **描述**: ~~tRPC maestro router 依赖 `maestro` 命令在系统 PATH 中可用。~~
- **修复**: 添加 `checkMaestroCliAvailable()` 函数（Windows `where` / Unix `which`），结果缓存到 `state.maestroAvailable`，不可用时跳过 MCP handshake 使用静态 catalog
- **提交**: `5a90909`

---

### P2 — 改进

#### NIT-001: KnowledgePanel 和 AnalysisPanel 缺少单元测试文件

- **类型**: nit
- **来源**: TASK-002, TASK-003
- **描述**: `KnowledgePanel` 和 `AnalysisPanel` 没有对应的 `*.test.tsx` 单元测试文件。
- **影响**: 重构时缺乏回归测试保护
- **修复方向**: 创建 React 渲染测试（bun test + react-testing-library）

---

#### NIT-002: MCP Provider 工具目录未与 Maestro-flow 源码同步

- **类型**: nit
- **来源**: TASK-001
- **描述**: `MAESTRO_TOOL_CATALOG` 是手动维护的静态列表，MCP 动态握手是正确方向但依赖完整 Superset monorepo。
- **影响**: 工具列表可能过时
- **修复方向**: 实现 MCP 动态握手自动发现工具

---

#### NIT-003: AnalysisPanel 推荐列表缺少操作入口

- **类型**: nit
- **来源**: TASK-003
- **描述**: `recommendations` 列表每个条目只是纯文本，没有操作按钮。
- **影响**: 用户看到建议但无法从 UI 中直接操作

---

#### NIT-004: CommandPalette 分类标题在空搜索时不显示计数

- **类型**: nit
- **来源**: TASK-004
- **描述**: 分类标签映射使用静态 `CATEGORY_LABELS`，扩展新分类时需手动同步。

---

#### NIT-005: WebSocketEventBus 无连接池限制

- **类型**: nit
- **来源**: TASK-005
- **描述**: `WebSocketEventBus` 接受任意客户端连接，没有连接数限制。

---

#### NIT-006: 缺少统一的错误边界组件

- **类型**: nit
- **来源**: TASK-002, TASK-003, TASK-004
- **描述**: 所有面板各自实现了 ErrorState 组件，可抽取为共享组件。

---

#### NIT-007: 概念翻译层覆盖不完整

- **类型**: nit
- **来源**: TASK-002, TASK-004
- **描述**: `mapType()` 将 `wiki` 映射为 `knowhow`，丢失了区分。

---

## 问题统计

| 分类 | P0 | P1 | P2 | 合计 |
|------|----|----|----|----|
| **bug** | ~~4~~ 0 | ~~2~~ 1 | 0 | ~~6~~ 1 |
| **ux** | 0 | ~~3~~ 0 | 0 | ~~3~~ 0 |
| **nit** | 0 | 0 | 7 | 7 |
| **合计** | ~~4~~ 0 | ~~5~~ 1 | 7 | ~~16~~ 8 |

---

## 修复记录

| 日期 | 问题 | 提交 | GAP |
|------|------|------|-----|
| 2026-06-24 | BUG-001 | `9a92d1e` | GAP-001 |
| 2026-06-24 | BUG-002 | `c48f1ac` | GAP-002 |
| 2026-06-24 | BUG-003 | `2cb3aad` | GAP-003 |
| 2026-06-24 | BUG-004 | `2cb3aad` | GAP-004 |
| 2026-06-24 | BUG-006 | `5a90909` | GAP-005 |
| 2026-06-24 | UX-001 | `eca123a` | GAP-006 |
| 2026-06-24 | UX-002 | `ac06bd2` | GAP-007 |
| 2026-06-24 | UX-003 | `cc3baf7` | GAP-008 |

**剩余待修复**: BUG-005 (WebSocket 端口) + 7 个 P2 改进项
