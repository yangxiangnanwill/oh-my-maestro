# TASK-004: 修复 stores/index.ts DelegateEvent 步骤状态映射错误

## Changes
- `src/lib/client/stores/index.ts`: 
  - 第 16 行 import 中添加 `StepStatus` 类型
  - 第 137-142 行新增 `STEP_STATUS_MAP` 常量，完整映射 DelegateEvent.type → StepStatus
  - 第 146 行将 `status: type === 'failed' ? 'failed' : 'complete'` 替换为 `status: STEP_STATUS_MAP[type] ?? 'pending'`

## Verification
- [x] grep "queued.*pending" 返回匹配行: 第 138 行 `queued: 'pending'`
- [x] grep "started.*running" 返回匹配行: 第 139 行 `started: 'running'`
- [x] grep "completed.*complete" 返回匹配行: 第 140 行 `completed: 'complete'`
- [x] grep "failed.*failed" 返回匹配行: 第 141 行 `failed: 'failed'`
- [x] grep "type === 'failed' ? 'failed' : 'complete'" 无匹配: 旧代码已完全替换
- [x] npx tsc --noEmit 通过

## Tests
- [x] npx tsc --noEmit: 通过（无错误输出）

## Deviations
- 任务描述说"第 16 行已导入 StepStatus"，但实际检查发现 import 中缺少 `StepStatus`。已在修改中补充导入。

## Notes
- 映射使用 `?? 'pending'` 作为 fallback，确保未知 type 值不会导致 undefined status
- 状态映射：queued→pending, started→running, completed→complete, failed→failed
