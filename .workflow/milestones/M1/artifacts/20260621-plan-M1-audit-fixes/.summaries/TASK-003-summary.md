# TASK-003: 修复 MEDIUM/LOW 质量问题：孤儿 projectState store + ParamDef 类型偏差 + init() 错误处理

## Changes
- `src/lib/shared/types.ts`: 添加 `export interface ParamDef { name: string; type: string; required: boolean; default?: unknown; }`，将 `WorkflowMeta.params` 从 `Record<string, unknown>` 改为 `ParamDef[]`
- `src/routes/+page.svelte`: 在 import 中添加 `projectState`，添加 `$effect` 块在挂载时 `fetch('/api/project/state')` 并将结果写入 `projectState` store
- `src/lib/server/index.ts`: 导入 `UnsupportedVersionError`，重构 `init()` catch 块为 `if (err instanceof UnsupportedVersionError)` 分支（console.warn）和 else 分支（console.error）
- `src/lib/server/cli-adapter.ts`: 将 `parseSkillsOutput` 中的 `params: parsed.params ?? {}` 改为 `params: Array.isArray(parsed.params) ? parsed.params : []`
- `src/lib/server/__tests__/cli-adapter.test.ts`: 更新测试数据从 `params: { target: 'prod' }` / `params: {}` 改为 `params: [{ name: 'target', type: 'string', required: true }]` / `params: []`，匹配新的 `ParamDef[]` 类型

## Verification
- [x] src/routes/+page.svelte 的 `<script>` 块中包含 fetch('/api/project/state') 调用: 第23行确认存在
- [x] src/lib/shared/types.ts 包含 export interface ParamDef { name: string; type: string; required: boolean; default?: unknown; }: 第119行确认存在
- [x] src/lib/shared/types.ts 中 WorkflowMeta.params 类型为 ParamDef[] 而非 Record<string, unknown>: 第132行确认 `params: ParamDef[]`
- [x] src/lib/server/index.ts 的 init() catch 块包含 if (err instanceof UnsupportedVersionError) 条件分支: 第117行确认存在
- [x] TypeScript 编译无错误（本任务修改范围）: `npx tsc --noEmit` 剩余 4 个错误全部为预先存在的（delegate-executor.ts:196, state-sync.ts:21,63），与本次修改无关

## Tests
- [x] `npx tsc --noEmit 2>&1`: 无新增 TypeScript 错误（4 个预先存在的错误不在本次任务范围）
- [x] `npx vitest run src/lib/server/__tests__/cli-adapter.test.ts`: 18 tests passed, 1 test file passed

## Deviations
- 额外修改了 `src/lib/server/__tests__/cli-adapter.test.ts`：测试文件中使用了旧的 `params: { target: 'prod' }` 和 `params: {}` 对象格式，需要更新为 `ParamDef[]` 格式才能通过 TypeScript 编译。这是 `cli-adapter.ts` 类型变更的必然连带修改。

## Notes
- 剩余的 4 个 TypeScript 错误（delegate-executor.ts:196 重复属性、state-sync.ts:21 chokidar 命名空间、state-sync.ts:63 隐式 any）属于预先存在的问题，不在本次任务范围内
- `projectState` store 现在通过两个途径获取数据：(1) 页面挂载时的 HTTP fetch（初始加载），(2) WebSocket 事件（实时更新）
