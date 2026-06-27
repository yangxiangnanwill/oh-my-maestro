# TASK-003: 创建缺失 store/stub 模块

## 状态
RETRY -- 文件已在前次执行中创建并提交，本次为重试验证。

## 变更
- `apps/desktop/src/renderer/stores/workspace-init.ts`: zustand store (useWorkspaceInitStore) + PendingTerminalSetup 类型（已存在，提交 2ed8585）
- `apps/desktop/src/renderer/stores/tabs/store.ts`: zustand store (useTabsStore) + Tab/Pane 类型（已存在，提交 2ed8585）
- `apps/desktop/src/renderer/stores/changes.ts`: zustand store (useChangesStore)（已存在，提交 2ed8585）
- `apps/desktop/src/renderer/stores/theme/utils.ts`: toXtermTheme 函数（已存在，提交 2ed8585）
- `apps/desktop/src/shared/agent-catalog.ts`: AgentCatalog 类型 re-export（已存在，提交 53e9f11）
- `apps/desktop/src/shared/agent-settings.ts`: AgentSettings 类型和工具函数（已存在，提交 53e9f11）
- `apps/desktop/src/shared/billing.ts`: BillingInfo 类型（已存在，提交 2ed8585）
- `apps/desktop/src/shared/host-routing.ts`: HostRoutingKey 类型 + buildHostRoutingKey 函数（已存在，提交 2ed8585）

## 验证
- [x] 所有 8 个文件存在且导出消费者所需的符号
- [x] workspace-init.ts 导出 useWorkspaceInitStore (zustand hook) 和 PendingTerminalSetup (type)
- [x] tabs/store.ts 导出 useTabsStore (zustand hook) + Tab 类型
- [x] changes.ts 导出 useChangesStore (zustand hook)
- [x] theme/utils.ts 导出 toXtermTheme 函数
- [x] agent-catalog.ts 重新导出 AgentDefinition 类型
- [x] agent-settings.ts 导出 AgentDefinition, validateTaskPromptTemplate, 等
- [x] billing.ts 导出 BillingInfo 类型
- [x] host-routing.ts 导出 HostRoutingKey 类型 + buildHostRoutingKey 函数
- [x] `bun run typecheck 2>&1 | grep -c TS2307` = 36，全部为非本任务模块的错误（DashboardSidebar, Chat/stubs, tiptap-markdown, @xterm/addon-*, shared/tabs-types 等）
- [x] 本任务 8 个模块相关的 TS2307 错误：0 个

## 附加验证（convergence criteria 中提及的额外文件）
- [x] main/lib/terminal/index.ts 导出 prewarmTerminalRuntime 和 reconcileDaemonSessions
- [x] main/lib/app-state/index.ts 导出 initAppState
- [x] main/lib/extensions/index.ts 导出 loadWebviewBrowserExtension
- [x] ThemedToaster/ThemedToaster.tsx 导出 ThemedToaster React 组件

## 测试
- [x] typecheck: `bun run typecheck 2>&1 | grep TS2307 | grep -E "(workspace-init|tabs/store|changes|theme/utils|agent-catalog|agent-settings|billing|host-routing)"` -- 无输出，即 0 个相关错误

## 偏差
- convergence criteria 中提到了 renderer/lib/terminal.ts、renderer/lib/app-state.ts、renderer/lib/extensions.ts 路径，但实际这些文件位于 main/lib/terminal/index.ts、main/lib/app-state/index.ts、main/lib/extensions/index.ts。这些文件已存在且功能完整。

## 备注
- 本次为 RETRY 执行，所有 8 个文件在前次执行（commit 2ed8585）中已创建并提交完毕
- 消费者导入验证：所有 8 个模块的消费者导入路径均正确解析，无 TS2307 错误
- 剩余的 36 个 TS2307 错误属于其他任务的范围（TASK-004: DashboardSidebar, TASK-005: 补全，等）
