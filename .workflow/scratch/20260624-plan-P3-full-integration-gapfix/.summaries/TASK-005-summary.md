# TASK-005: CommandPalette 终端执行接入 — 替换 TODO 为实际执行逻辑

## Changes
- `apps/desktop/src/renderer/components/CommandPalette/CommandPalette.tsx`: 移除 handleSelect 函数中的 TODO 注释块（第 214-217 行），替换为实际的命令执行逻辑

## Verification
- [x] `grep -c "TODO: Wave 3"` 返回 0: TODO 已完全移除
- [x] `grep -c "cliLine"` 返回 5 (>=2): cliLine 在变量定义、console.log、terminalWrite、terminal:execute、console.warn 中共 5 处使用
- [x] `grep -c "terminalWrite\|terminal.*execute\|electronAPI"` 返回 7 (>=1): 执行逻辑存在
- [x] handleSelect 在调用 onClose() 前执行了命令: 先通过 electronAPI 发送命令，再调用 onClose()

## Tests
- [x] `grep -n "TODO"` : 无输出（无残留 TODO）
- [x] `grep -n "cliLine"` : 显示 5 行匹配（209, 211, 217, 219, 223）

## Deviations
- 任务 action 中提到优先使用 `electronTrpc.terminal.execute.mutate()`，但 terminal tRPC router 目录（`apps/desktop/src/lib/trpc/routers/terminal/`）不存在，无法使用 tRPC 方案。按任务 risk mitigation 策略，采用 `window.electronAPI` fallback 方案。
- `window.electronAPI` 在 TypeScript 中无类型声明，使用 `(window as any).electronAPI` 绕过类型检查。这是预期行为，因为 preload 脚本尚未暴露 electronAPI。
- 双重 fallback 策略：优先 `electronAPI.terminalWrite()`，其次 `electronAPI.send("terminal:execute", ...)`，最后 console.warn 记录不可用状态。

## Notes
- 当主进程侧实现 terminal tRPC router 后，可以将执行逻辑升级为 `electronTrpc.terminal.execute.mutate()` 以获得类型安全
- 当 preload 脚本暴露 `electronAPI` 后，可以移除 `(window as any)` 类型断言并添加 `Window` 接口扩展
