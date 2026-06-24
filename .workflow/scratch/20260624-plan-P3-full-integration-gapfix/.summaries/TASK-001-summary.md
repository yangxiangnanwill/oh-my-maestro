# TASK-001: 创建 lib/trpc/index.ts — tRPC 核心初始化

## Changes
- `D:/WorkSpace/VsCode/oh-my-maestro/apps/desktop/src/lib/trpc/index.ts`: 创建文件，包含 tRPC 核心初始化代码（initTRPC.create()），导出 router 和 publicProcedure

## Verification
- [x] `grep -c "export const router"` 返回 1 (>=1): 第5行 `export const router = t.router;`
- [x] `grep -c "export const publicProcedure"` 返回 1 (>=1): 第6行 `export const publicProcedure = t.procedure;`
- [x] `grep -c "initTRPC"` 返回 2 (>=1): 第1行 import + 第3行 .create() 调用
- [x] 文件存在且不为空: 4 行代码，142 字节

## Tests
- [x] `grep -n "export const router\|export const publicProcedure\|initTRPC"`: 通过 — 输出显示所有 3 个符号在第 1、3、5、6 行

## Deviations
- None

## Notes
- 文件被 `routers/command-chain/index.ts` 和 `routers/maestro/index.ts` 通过 `from "../.."` 导入
- 文件被 `routers/index.ts` 通过 `from ".."` 导入
- @trpc/server 依赖安装由 TASK-003 处理
- 最小化实现，无 context/middleware，满足所有现有 router 的需求
