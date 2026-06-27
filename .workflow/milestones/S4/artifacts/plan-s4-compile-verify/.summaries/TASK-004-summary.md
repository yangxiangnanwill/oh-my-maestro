# TASK-004: 修复 process-tree-stub.ts 函数签名

## Changes
- `apps/desktop/src/main/lib/terminal-host/process-tree-stub.ts`: 修复 3 个函数签名 + 扩展 ProcessSignalError 类
  - `signalProcessTreeAndGroups`: 从 `(pid, signal?) => Promise<void>` 改为 `(pid, signal?, options?) => ProcessSignalTarget[]`，新增 `options` 参数支持 `signalPids` 和 `onSignalError` 回调
  - `signalProcessTargets`: 从 `(targets) => Promise<void>` 改为 `(targets, signal?, onError?) => Promise<void>`，新增 `signal` 和 `onError` 参数
  - `ProcessSignalError`: 从简单的 `Error` 子类扩展为包含 `error`, `target`, `signal`, `id` 属性的完整类，匹配 pty-subprocess.ts 中 `logProcessSignalError` 的使用方式

## Verification
- [x] `signalProcessTreeAndGroups` 接受 3 参数并返回 `ProcessSignalTarget[]`: 签名已更新为 `(pid, signal?, options?: { signalPids?: boolean; onSignalError?: (error: ProcessSignalError) => void }) => ProcessSignalTarget[]`
- [x] `signalProcessTargets` 接受 3 参数: 签名已更新为 `(targets: ProcessSignalTarget[], signal?: string, onError?: (target: ProcessSignalTarget, error: Error) => void) => Promise<void>`
- [x] `ProcessSignalTarget` 类型已导出: 接口保持 `export interface ProcessSignalTarget` 不变
- [x] tsconfig.json 中 pty-subprocess.ts 仍在 exclude 列表中: 已确认第 84 行仍在 exclude 数组中

## Tests
- [x] `bun run typecheck`: 无 process-tree-stub 或 pty-subprocess 相关类型错误（所有预存错误均与此任务无关）

## Deviations
- 额外修改了 `ProcessSignalError` 类：原任务描述未提及，但消费者代码 `pty-subprocess.ts` 中的 `logProcessSignalError` 函数访问了 `event.error`, `event.target`, `event.signal`, `event.id` 属性，原 stub 只有 `message` 属性会导致类型错误。此修改是使 stub 与消费者代码兼容的必要补充。

## Notes
- pty-subprocess.ts 仍在 tsconfig.json exclude 列表中，其解除排除由 TASK-008 负责
- 此修复是解除 pty-subprocess.ts 排除的前置条件
