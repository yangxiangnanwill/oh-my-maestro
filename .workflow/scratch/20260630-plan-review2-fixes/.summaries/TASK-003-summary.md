# TASK-003: 删除 host-service-coordinator 未使用 import（ISS-012/REV2-004）

## Changes
- `apps/desktop/src/main/lib/host-service-coordinator.ts`: 从 `import type { ... } from "shared/host-info-types"` 块中删除两个未使用 import：`HostServiceStatusEvent`（原 line 8）与 `HostServiceCoordinatorEvents`（原 line 13）。保留 HostServiceStatus / Connection / HostServiceStartOpts / HostServiceRestartOpts / HostServiceResetOpts（类体仍在使用）。仅改 import 块，未触碰其他代码。

## Verification
- [x] `grep 'HostServiceStatusEvent' apps/desktop/src/main/lib/host-service-coordinator.ts` 无命中：Grep 输出 "No matches found"
- [x] `grep 'HostServiceCoordinatorEvents' apps/desktop/src/main/lib/host-service-coordinator.ts` 无命中：同上，合并 grep 两类型均无命中
- [x] `cd apps/desktop && bunx biome lint src/main/lib/host-service-coordinator.ts` exits 0：输出 "Checked 1 file in 12ms. No fixes applied."，EXIT=0
- [x] `cd apps/desktop && bun run typecheck` exits 0：`tsc --noEmit` 通过，EXIT=0

## Tests
- [x] `cd apps/desktop && bunx biome lint src/main/lib/host-service-coordinator.ts`: pass（exit 0，无 lint 错误）
- [x] `cd apps/desktop && bun run typecheck`: pass（exit 0）

## Deviations
- None。改动范围与 task 定义完全一致，未触碰 scope 外文件。

## Notes
- TASK-001 若改同一文件，改动区域不同（TASK-001 注释指向 line-2 注释块，TASK-003 改 import 块 line 6-14），无冲突。本任务执行时文件内容与已验证事实一致，未见 TASK-001 改动痕迹，直接基于当前状态操作。
- 未执行 git commit（按约束要求）。
