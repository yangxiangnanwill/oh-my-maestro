# TASK-001: Maestro MCP Server 注册为 Superset MCP Provider

## Changes
- `apps/desktop/src/main/lib/agent-setup/maestro-mcp-provider.ts` (新建): 实现 `registerMaestroMcpProvider()` 函数，包含：
  - 29 个工具的静态目录（knowledge/analysis/command/utility 分类）
  - MCP SDK 动态握手逻辑（`@modelcontextprotocol/sdk` 的 `StdioClientTransport`）
  - Superset MCP Registry 动态注册尝试（带优雅降级）
  - 完整的错误处理、日志记录和生命周期管理（`disposeMaestroMcpProvider()`）
  - 导出 `getMaestroToolCatalog()`、`getMaestroMcpTools()`、`getMaestroMcpState()`
- `apps/desktop/src/main/index.ts` (修改): 
  - 新增 import `registerMaestroMcpProvider`
  - 在 `setupAgentHooks()` try/catch 之后添加 `registerMaestroMcpProvider()` 调用（包裹在独立 try/catch 中）
- `apps/desktop/src/lib/trpc/routers/maestro/index.ts` (新建): `createMaestroRouter()` 包含三个 query endpoints：
  - `knowledge.search(input: {query, cwd})` → 执行 `maestro search` 并返回结构化 KG 搜索结果
  - `analyze.result(input: {cwd, topic?})` → 执行 `maestro analyze --json` 返回 6 维评分 + 风险矩阵
  - `commands.list(input: {filter?})` → 返回 29 个可用 Maestro command 列表（支持按类别/名称/描述过滤）
- `apps/desktop/src/lib/trpc/routers/index.ts` (修改): 导入并注册 `createMaestroRouter()` 到 `createAppRouter()` 中

## Verification
- [x] `registerMaestroMcpProvider()` 函数存在于 `apps/desktop/src/main/lib/agent-setup/` 目录中: 已在 `maestro-mcp-provider.ts` 中实现（第 394 行）
- [x] `main/index.ts` 中 setupAgentHooks() 之后调用了 `registerMaestroMcpProvider()`: 第 423-427 行，独立 try/catch 块
- [x] 新增 `maestro/` tRPC router 包含 `knowledge.search`、`analyze.result`、`commands.list` 三个 query endpoints: 已在 `maestro/index.ts` 中实现
- [x] `maestro/` router 已注册到主 tRPC router: `routers/index.ts` 第 13 行 import，第 40 行注册
- [x] `grep -r 'registerMaestroMcpProvider' apps/desktop/src/main/` 返回至少 2 处匹配: 3 处匹配（import + 调用 + 定义）
- [x] `grep -r 'maestro' apps/desktop/src/lib/trpc/routers/index.ts` 返回至少 1 处匹配: 2 处匹配（import + 注册）

## Tests
- 测试命令 `bun run build` 和 `bun run test -- --grep 'maestro'` 需要完整 Superset monorepo 环境（含 `@superset/shared` tRPC 基础设施、`bun` 运行时），当前工作空间为部分检出，无法执行。代码已通过：
  - 导入路径遵循现有 `command-chain/index.ts` 的 `from "../.."` 模式
  - Zod schema 定义与现有 `command-chain/index.ts` 风格一致
  - 所有类型引用使用现有代码库中的路径约定

## Deviations
- **MCP SDK 动态导入**: 使用 `await import("@modelcontextprotocol/sdk/...")` 而非顶层静态 import。原因：MCP SDK 可能未安装在当前环境中，动态 import 支持优雅降级到静态工具目录。
- **Superset MCP Registry 注册**: 使用 `await import("@superset/mcp-v2/tools/register")` 动态导入尝试注册，失败时静默降级。原因：`packages/mcp-v2/` 不在当前工作空间检出中。
- **`main/index.ts` 中 `registerMaestroMcpProvider()` 不 await**: 函数返回 `Promise<void>` 但在 IIFE 中直接调用（无 `await`），这与同一 IIFE 中其他异步调用的模式一致（如 `loadWebviewBrowserExtension()`、`reconcileDaemonSessions()`）。注册完成的日志会在后台异步输出。
- **tRPC root 文件缺失**: `apps/desktop/src/lib/trpc/index.ts` 在当前工作空间中不存在（应位于完整 Superset monorepo 中）。`command-chain/index.ts` 已使用 `from "../.."` 导入模式，maestro router 遵循相同模式。

## Notes
- 后续任务可直接导入 `getMaestroToolCatalog()`、`getMaestroMcpTools()` 来获取工具列表
- `registerMaestroMcpProvider()` 内部有去重逻辑（`state.registered` flag），多次调用安全
- 工具目录包含 29 个 Maestro command，覆盖 knowledge/analysis/command/utility 四个类别
- 如需在完整 Superset monorepo 中验证，建议先确保 `@modelcontextprotocol/sdk` 和 `@superset/mcp-v2` 包可用
