# TASK-001 Summary: TerminalManager — node-pty PTY Session Management

## Status: ✅ COMPLETED

## Files Created
- `src/lib/server/terminal-manager.ts` — 新建 (217 行): TerminalManager 类，node-pty PTY 会话管理、33ms 帧节流、环形缓冲区(容量 1000)、5 会话上限
- `src/lib/server/__tests__/terminal-manager.test.ts` — 新建 (331 行): 25 个测试用例

## Convergence Criteria Verification
- [x] `export class TerminalManager` — ✅ terminal-manager.ts
- [x] 构造函数接受 `(eventBus: EventBus, spawnPty?)` — ✅ DI 模式
- [x] `createTerminal(terminalId, options)` 调用 node-pty spawn 返回 TerminalSession — ✅
- [x] `createTerminal` 超过 maxSessions=5 抛 Error — ✅
- [x] PTY data 事件 33ms setInterval flush 发射 OUTPUT — ✅
- [x] EventBus.publish 调用签名正确 — ✅
- [x] `writeToTerminal(terminalId, data)` 调用 pty.write — ✅
- [x] `resizeTerminal(terminalId, cols, rows)` 调用 pty.resize + 发射 RESIZE — ✅
- [x] `destroyTerminal(terminalId)` kill PTY + 清除 timer + 删除 session + 发射 EXIT — ✅
- [x] `destroyTerminal` 对不存在 terminalId 静默无操作 — ✅
- [x] ringBuffer 为 TerminalOutputEntry[]，push 时 length >= 1000 则 shift — ✅
- [x] 构造器中订阅 EventBus Channels.TERMINAL term:input 事件 — ✅
- [x] 测试文件存在且全部通过 — ✅ 25 tests passed

## Test Results
- TerminalManager: 25/25 passing
- Full suite: 129/129 passing (8 test files)
- No regressions

## Key Decisions
1. 构造函数订阅直接写 PTY 而非调用 writeToTerminal — 避免重入循环
2. onExit 独立处理方法 handlePtyExit — 统一 PTY 退出和手动销毁的清理逻辑
3. 33ms 帧节流用 setInterval + buffer 数组 — 高效批量输出
4. 环形缓冲区用 push + shift — 简单直观，容量 1000 时性能足够

## Deviations
- 构造函数订阅实现略有调整：直接调用 `active.pty.write(data)` 而非 `this.writeToTerminal()`，避免 INPUT 事件重入循环。这是对计划中 "调用 this.writeToTerminal" 的正确修正。
