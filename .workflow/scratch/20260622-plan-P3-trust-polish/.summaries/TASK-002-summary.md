# TASK-002: Windows ConPTY 兼容性修复

## Changes
- `src/lib/server/index.ts`: 在 SIGINT 处理器之后添加 `process.on('SIGBREAK', ...)` 监听（Windows ConPTY 使用 SIGBREAK 而非 SIGINT 终止进程）和 `process.on('exit', ...)` 兜底清理处理器
- `src/lib/server/terminal-manager.ts`: SHELL_WHITELIST Set 添加 `'wsl.exe'`，使 Windows 用户可创建 WSL 终端
- `src/lib/server/terminal-manager.ts`: ActiveTerminal 接口添加 `_resizing?: boolean` 字段；resizeTerminal() 方法添加 `_resizing` 防回环逻辑（调用前检查标记、设置标记、setTimeout(0) 后清除）
- `src/lib/server/__tests__/terminal-manager.test.ts`: 添加 resize 防回环测试用例 — 验证连续 resize 第二次被跳过，setTimeout 后恢复

## Verification
- [x] grep -r 'SIGBREAK' src/lib/server/index.ts 返回至少 1 行: 第 274-275 行，process.on('SIGBREAK', ...) 已添加
- [x] grep -r "process.on('exit'" src/lib/server/index.ts 返回至少 1 行: 第 281 行，exit 兜底处理器已添加
- [x] grep -r "'wsl.exe'" src/lib/server/terminal-manager.ts 返回 1 行: 第 47 行，SHELL_WHITELIST 已包含 wsl.exe
- [x] grep -r '_resizing' src/lib/server/terminal-manager.ts 返回 ActiveTerminal 接口字段定义（第 24 行）和 resizeTerminal() 方法中的防回环逻辑（第 201/203/208/210 行）
- [x] npx vitest run src/lib/server/__tests__/terminal-manager.test.ts 全部通过（26 tests passed），无回归

## Tests
- [x] npx vitest run src/lib/server/__tests__/terminal-manager.test.ts: 26 tests passed, 0 failures
- [x] npx tsc --noEmit: 零错误

## Deviations
- None

## Notes
- SIGBREAK 在非 Windows 平台上不存在但 Node.js 会忽略未知信号，不会导致运行时错误
- _resizing 防回环模式与现有 _exiting 防重复模式一致，降低认知负担
- 新增的 resize 防回环测试使用 vi.advanceTimersByTime(0) 模拟 setTimeout(0) 完成，验证了标记清除后的恢复行为
