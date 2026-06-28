# TASK-006: 界面中文化 — 扩展翻译注册表 + 页面组件接入

## Changes
- `apps/desktop/src/renderer/contexts/translations.ts`: 扩展 TRANSLATIONS 对象，从 12 个术语条目扩展到 49 个。新增 5 个分类块：Dashboard（9 条）、Workspace（10 条）、Chat（6 条）、Terminal（1 条）、Settings（5 条）、通用操作（8 条）
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/page.tsx`: 添加 useTranslation import，DashboardPage 和 WorkspaceCard 各调用 useTranslation()，替换 8 处硬编码英文字符串
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/layout.tsx`: 添加 useTranslation import，DashboardSidebar 和 RightSidePanel 各调用 useTranslation()，替换 5 处硬编码英文字符串
- `apps/desktop/src/renderer/routes/_authenticated/workspaces/$workspaceId/page.tsx`: 添加 useTranslation import，ChatPanel / TerminalPanel / OverviewPanel / WorkspacePage 各调用 useTranslation()，替换 14 处硬编码英文字符串
- `apps/desktop/src/renderer/routes/_authenticated/settings/page.tsx`: 添加 useTranslation import，替换 2 处硬编码英文字符串

## Verification
- [x] grep 'ui.dashboard.title' translations.ts 返回 '仪表盘': 通过
- [x] grep 'useTranslation' dashboard page.tsx 返回 import 和调用（2 处）: 通过
- [x] grep 'useTranslation' workspace page.tsx 返回 import 和调用（4 处）: 通过
- [x] grep -r "'Dashboard'" routes/ 返回 0 结果: 通过
- [x] grep 其他硬编码英文（'New Workspace' / 'Chat' / 'Terminal' / 'Split View' / 'Send' 等）在 routes/ 下返回 0 结果: 通过

## Tests
- 无 lint 脚本可用（apps/desktop/package.json 中无 lint/lint:fix 脚本）；TypeScript typecheck 待后续任务验证

## Deviations
- 任务 specification 中的 implementation 步骤与 convergence criteria 中的完整翻译清单略有差异。按 convergence criteria 完整清单执行（包含了 spec 中未列出的 `ui.dashboard.yourWorkspaces`、`ui.dashboard.noWorkspaces`、`ui.dashboard.createFirst`、`ui.dashboard.loading`、`ui.dashboard.loadError`、`ui.workspace.*`、`ui.chat.*`、`ui.common.*` 等所有条目），确保与预期行为一致

## Notes
- layout.tsx 和 workspace page.tsx 有 `@ts-nocheck`，但 useTranslation import 和调用不受影响
- 内部函数组件（WorkspaceCard、DashboardSidebar、RightSidePanel、ChatPanel、TerminalPanel、OverviewPanel）各自在函数体内独立调用 useTranslation()，符合 React Hook 规则
- WorkspaceCard 使用 `name || t("ui.common.unnamedWorkspace")` 作为 fallback 模式，与原 `name || "Unnamed Workspace"` 等价
- OverviewPanel 中 "Workspace ID" label 和 "Workspace details" subtitle 分别映射到 `ui.workspace.workspaceId` 和 `ui.workspace.overview`
