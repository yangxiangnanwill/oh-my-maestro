# TASK-003: Windows 兼容性杂项修复 — 字体路径、平台守卫验证

## Changes
- `apps/desktop/src/main/index.ts`: 将 SYSTEM_FONT_DIRS 从 darwin-only 改为三路平台分支 — darwin 保持现有路径，win32 使用 `['C:\\Windows\\Fonts']`，其他平台返回空数组。同时将 `if (process.platform === "darwin")` 守卫改为 `if (SYSTEM_FONT_DIRS.length > 0)` 守卫，使字体协议处理逻辑与平台无关。

## Verification
- [x] `apps/desktop/src/main/index.ts` 中 SYSTEM_FONT_DIRS 包含 `'C:\\Windows\\Fonts'` 或 win32 分支: 已确认 — 第 373-375 行有 `process.platform === "win32" ? ["C:\\Windows\\Fonts"] : []`
- [x] `process-tree.ts` 包含 try/catch require('@superset/macos-process-metrics'): 已确认 — 第 5-12 行已有 try/catch 守卫
- [x] `apple-events-permission.ts`、`dock-icon.ts`、`tray/index.ts` 均包含 process.platform !== 'darwin' 守卫: 已确认 — 三个文件分别在第 13、212、278 行已有守卫
- [x] `play-sound.ts` 包含 process.platform === 'darwin' 条件分支: 已确认 — 第 30 行已有 darwin 分支（darwin 用 afplay，Linux 用 paplay/aplay）

## Tests
- 无 test.commands 定义，此任务为纯代码守卫验证 + 字体路径扩展

## Deviations
- 无

## Notes
- `process-tree.ts`、`apple-events-permission.ts`、`dock-icon.ts`、`tray/index.ts`、`play-sound.ts` 五个文件的平台守卫在任务执行前已存在，无需修改
- 唯一实际修改为 `index.ts` 的 SYSTEM_FONT_DIRS 三路分支化
- 文件在 TASK-002 中被删除后重新创建，提交时以 `create mode` 记录
