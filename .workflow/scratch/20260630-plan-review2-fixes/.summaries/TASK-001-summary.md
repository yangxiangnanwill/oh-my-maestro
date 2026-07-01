# TASK-001: 提取 ExternalApp/TerminalPreset + isSafeExternalUrl 到 src/shared 跨层契约层

## Changes
- `apps/desktop/src/shared/external-app-types.ts` (create): 搬移 EXTERNAL_APPS const + ExternalApp type + NON_EDITOR_APPS + EXECUTION_MODES/ExecutionMode + TerminalPreset interface 从 local-db/index.ts
- `apps/desktop/src/shared/safe-url/scheme.ts` (create): 搬移 ALLOWED_SCHEMES + isSafeExternalUrl + externalUrlLogLabel 实现从 main/lib/safe-url/scheme.ts
- `apps/desktop/src/shared/safe-url/index.ts` (create): barrel re-export `export { externalUrlLogLabel, isSafeExternalUrl } from './scheme'`
- `apps/desktop/src/main/lib/local-db/index.ts` (modify): 删除搬移的定义，改为 re-export `export { EXTERNAL_APPS, NON_EDITOR_APPS, EXECUTION_MODES } from 'shared/external-app-types'` + `export type { ExternalApp, ExecutionMode, TerminalPreset } from 'shared/external-app-types'`（保持 main 侧 7 消费者零改动）
- `apps/desktop/src/main/lib/safe-url/scheme.ts` (modify): 改为 re-export shim（不删除），`export { externalUrlLogLabel, isSafeExternalUrl } from 'shared/safe-url'`，保持 `./scheme` import 链不断裂
- `apps/desktop/src/renderer/commandPalette/core/types.ts` (modify): `@main/lib/local-db` → `shared/external-app-types`（ExternalApp）
- `apps/desktop/src/renderer/commandPalette/modules/openIn/commands.ts` (modify): 同上（ExternalApp）
- `apps/desktop/src/renderer/components/OpenInButton/OpenInButton.tsx` (modify): 同上（ExternalApp）
- `apps/desktop/src/renderer/components/OpenInExternalDropdown/OpenInExternalDropdownItems.tsx` (modify): 同上（ExternalApp）
- `apps/desktop/src/renderer/components/OpenInExternalDropdown/constants.ts` (modify): 同上（ExternalApp）
- `apps/desktop/src/renderer/lib/agent-session-orchestrator/types.ts` (modify): 同上（TerminalPreset）

## Verification
- [x] grep 'from "shared/external-app-types"' commandPalette/core/types.ts 命中
- [x] grep '@main/lib/local-db' commandPalette/core/types.ts 无命中（renderer 全域 grep 无命中）
- [x] grep 'from "shared/external-app-types"' commandPalette/modules/openIn/commands.ts 命中
- [x] grep 'from "shared/external-app-types"' OpenInButton/OpenInButton.tsx 命中
- [x] grep 'from "shared/external-app-types"' OpenInExternalDropdown/OpenInExternalDropdownItems.tsx 命中
- [x] grep 'from "shared/external-app-types"' OpenInExternalDropdown/constants.ts 命中
- [x] grep 'from "shared/external-app-types"' agent-session-orchestrator/types.ts 命中
- [x] test -f src/shared/external-app-types.ts 文件存在
- [x] test -f src/shared/safe-url/index.ts 文件存在
- [x] grep 'export.*EXTERNAL_APPS.*from.*shared/external-app-types' local-db/index.ts 命中（line 148）
- [x] grep 'export.*isSafeExternalUrl.*from.*shared/safe-url' main/lib/safe-url/scheme.ts 命中（line 5）
- [x] cd apps/desktop && bun run typecheck exits 0（tsc --noEmit 0 errors）
- [x] safe-url.test.ts 的 `from "./scheme"` import 链保持（5 pass / 0 fail）

## Tests
- [x] `cd apps/desktop && bun run typecheck`: PASS (exit 0, tsc --noEmit clean)
- [x] `grep -rl 'from "shared/external-app-types"' apps/desktop/src/renderer/`: PASS (6 文件命中，正好对应 6 个 renderer 消费者)
- [x] `bun test src/main/lib/safe-url/safe-url.test.ts`: PASS (5 pass / 0 fail / 19 expects — re-export shim 保持 ./scheme import 链)

## Deviations
- None. 实现完全按 action/files/implementation 描述执行。

## Notes
- shared 层路径别名 `shared/*` → `./src/shared/*` 已在 tsconfig.json line 27 配置，无需新增。
- main 侧 7 个消费者（external/helpers.ts, external/index.ts, settings/index.ts, settings/preset-execution-mode.ts, workspaces/procedures/query.ts, local-db/index.ts, local-db/schema/zod.ts）零改动——通过 local-db/index.ts 的 re-export 保持向后兼容。
- TerminalPreset 依赖 ExecutionMode，两者一并搬到 shared/external-app-types.ts（local-db 中 TerminalPreset interface 原位置 line 275-287 已删除，EXECUTION_MODES line 243-250 已删除）。
- main/lib/safe-url/scheme.ts 不删除，作为 re-export shim；safe-url.ts、safe-url/index.ts、safe-url.test.ts 三个 `./scheme` 消费者零改动。
- 为 ISS-010/011 的后续工作奠定基础：renderer 不再 import main 路径，依赖方向已纠正。
- 未自动 git commit（按 task 要求）。
