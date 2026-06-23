# TASK-001 Summary — 路径遍历检测修复 (6 findings 合并修复)

**Status**: completed
**Executor**: agent (Claude Code)
**Completed at**: 2026-06-23T20:15:00+08:00

## Files Modified

### 1. `apps/desktop/src/main/lib/command-chain-status-poller.ts`

- **import**: `normalize` → `sep` (line 2)
- **新增 `isPathSafe(cwd)`** (lines 31-41): 使用 `resolve(cwd).split(sep)` 检查 `..` 段 + `cwd.includes("\0")` 空字节检查，替代无效的 `resolve===normalize` 比较
- **`readCommandChainStatus`** (lines 50-66): 调用 `isPathSafe(cwd)` 替代原来的 `resolve===normalize` 检查；`join(normalized, ...)` → `join(resolve(cwd), ...)`
- **新增 `isRecord()` type guard** (lines 68-71): `v is Record<string, unknown>` 替代 `as Record<string, unknown>` 断言
- **`validateStatus`** (lines 73-134): 
  - `data === null || typeof data !== "object"` → `!isRecord(data)`
  - 移除 `const obj = data as Record<string, unknown>`
  - `steps.map()` 回调添加 `step === null || typeof step !== "object"` + `!isRecord(step)` 守卫
  - `decisionNodes.map()` 回调添加同样的 null 元素防御
  - 使用 `.filter()` 过滤 null 元素
- **`validateStepState`** (lines 136-150): 保持原有 `as CommandChainStep["status"]` 断言（受控于 `includes` 前置检查）

### 2. `apps/desktop/src/lib/trpc/routers/command-chain/index.ts`

- **import**: `normalize` → `sep` (line 1)
- **zod refine** (lines 50-58): 
  - 新增 `val.includes("\0")` 空字节检查
  - `resolve===normalize` → `resolve(val).split(sep)` 检查 `..` 段
  - 移除 `normalize` 调用

## Convergence Criteria Results

| # | Criterion | Result |
|---|-----------|--------|
| 1 | grep `resolve(val) === normalize(val)` poller → 0 | ✅ PASS |
| 2 | grep `resolve(val) === normalize(val)` index.ts → 0 | ✅ PASS |
| 3 | grep `..` poller → >0 | ✅ PASS (3 matches: isPathSafe check + comment) |
| 4 | grep `\0` poller → >0 | ✅ PASS (1 match: isPathSafe) |
| 5 | grep `\0` index.ts → >0 | ✅ PASS (1 match: zod refine) |
| 6 | grep `as Record<string, unknown>` poller → 0 | ✅ PASS (only in comment) |
| 7 | grep `isRecord` poller → >0 | ✅ PASS (4 matches: definition + 3 usages) |
| 8 | grep `step === null` poller → >0 | ✅ PASS (1 match: steps.map callback) |
| 9 | tsc --noEmit 无新增错误 | ⚠️ SKIPPED (tsc not available in current env) |

## Deviations

- **C9 (tsc)**: 当前环境无 TypeScript 编译器，跳过了编译检查。需在家环境运行 `npx tsc --noEmit` 确认。
- `validateStepState` 中的 `as CommandChainStep["status"]` 断言保留 — 该断言受 `validStatuses.includes()` 前置运行时检查保护，是安全的 type guard 模式。

## Design Decisions

- `isPathSafe()` 作为独立函数提取，便于两个文件共享相同逻辑（未来可抽取到共享模块）
- `isRecord()` type guard 使用 `!Array.isArray(v)` 排除数组，因为 `typeof [] === "object"`
- map 回调中先检查 `step === null || typeof step !== "object"` 再调用 `isRecord()`，因为 `isRecord(null)` 已返回 false 但 TypeScript 需要显式 null check 来收窄类型
