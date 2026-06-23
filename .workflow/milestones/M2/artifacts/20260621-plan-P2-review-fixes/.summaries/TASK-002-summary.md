# TASK-002: 修复 dialog-manager.ts NDJSON 跨 chunk 行缓冲

## Changes
- `src/lib/server/dialog-manager.ts` (第 124-136 行): 将 spawnClaudeCLI 中 stdout 'data' 回调的直接 split('\n') 逻辑替换为基于 activeDialog.buffer 的跨 chunk 行缓冲模式

## Verification
- [x] grep -n "activeDialog.buffer" 在 spawnClaudeCLI 方法内返回匹配行: 第 127/128/130 行，共 3 处引用
- [x] grep -n "activeDialog.buffer = " 返回匹配行: 第 130 行 (lines.pop() 赋值)
- [x] grep -n "activeDialog.buffer += " 返回匹配行: 第 127 行 (chunk 追加)
- [x] grep -n "activeDialog.buffer.split" 返回匹配行: 第 128 行 (按 \n 分割)
- [x] npx vitest run src/lib/server/__tests__/delegate-executor.test.ts 通过: 22 tests passed

## Tests
- [x] npx vitest run src/lib/server/__tests__/delegate-executor.test.ts: 22/22 passed (1.02s)
- [x] npx tsc --noEmit: 无新增错误（现有错误均在 event-bus.ts 和 stores/index.ts，属预存问题）

## Deviations
- 无

## Notes
- ActiveDialog.buffer 字段在接口定义和 createSession 初始化中已存在，本次修复仅将其投入使用
- 使用经典的 "追加 + split + pop 保留尾部" 行缓冲模式，与 Node.js 社区标准做法一致
- 预存的 tsc --noEmit 错误 (event-bus.ts downlevelIteration, stores/index.ts StepStatus) 不在本任务范围内
