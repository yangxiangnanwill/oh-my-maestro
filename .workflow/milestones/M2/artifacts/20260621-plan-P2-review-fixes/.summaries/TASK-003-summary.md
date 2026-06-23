# TASK-003 Summary

**修复**: PTY 退出时 buffer 未 flush + 清理逻辑去重 [CORR-001] [MAINT-001]

## 变更

### terminal-manager.ts
1. **ActiveTerminal 接口**: 添加 `_exiting?: boolean` 字段
2. **新增 cleanupSession 私有方法**: 统一清理逻辑 — flush buffer（如需要）→ 清除 throttleTimer → sessions.delete → 发布 EXIT 事件
3. **destroyTerminal 重构**: 先设置 `_exiting = true` 再 kill PTY（防止 onExit 重复触发），然后调用 `cleanupSession(terminalId, null, true)`
4. **handlePtyExit 重构**: 检查 `_exiting` 标记跳过重复清理，调用 `cleanupSession(terminalId, exitCode, true)`
5. **pty.onExit 回调**: 添加 `_exiting` 检查，跳过已清理的会话

### terminal-manager.test.ts
- 更新 "should clear throttle timer on destroy" → "should flush residual buffer on destroy"
- 更新 "should clear throttle timer on PTY exit" → "should flush residual buffer on PTY exit"
- 两个测试现在验证 buffer 在退出时被正确 flush 为 OUTPUT 事件

## 验证
- 25/25 vitest 测试通过
- tsc --noEmit 无错误
- 所有 5 个 convergence criteria 通过
