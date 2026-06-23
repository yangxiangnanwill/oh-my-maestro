# TASK-003: P0 性能优化 — skipHistory + backpressure

## Changes
- `src/lib/server/event-bus.ts`: publish() 增加 `options?: { skipHistory?: boolean }` 参数，skipHistory=true 时跳过 history.push()；maxHistory 从 1000 降至 100
- `src/lib/server/ws-gateway.ts`: sendToClient() 增加 bufferedAmount > 65536 的背压检查，超限跳过并 warn；broadcastEvent() 对 term:output 和 dialog:stream-chunk 事件跳过 translator.translate() 调用
- `src/lib/server/terminal-manager.ts`: startFrameThrottle() 和 cleanupSession() 的 OUTPUT 事件 publish 调用添加 `{ skipHistory: true }`
- `src/lib/server/dialog-manager.ts`: emitStreamChunk() 的 STREAM_CHUNK 事件 publish 调用添加 `{ skipHistory: true }`
- `src/lib/server/__tests__/event-bus.test.ts`: 添加 4 个新测试（skipHistory 行为、skipHistory 仍传递事件、maxHistory=100 验证、p95 延迟 < 500ms）
- `src/lib/server/__tests__/ws-gateway.test.ts`: 添加 3 个新测试（backpressure 跳过慢客户端、backpressure 正常客户端仍接收、高频事件跳过翻译中间件）

## Verification
- [x] grep -r 'skipHistory' src/lib/server/event-bus.ts 返回至少 3 行: 3 行（参数注释、参数解构、条件判断）
- [x] grep -r 'bufferedAmount' src/lib/server/ws-gateway.ts 返回至少 1 行: 3 行（注释、条件判断、warn 日志）
- [x] grep -r 'skipHistory.*true' src/lib/server/terminal-manager.ts 返回至少 2 行: 2 行（startFrameThrottle 第 295 行、cleanupSession 第 348 行）
- [x] grep -r 'skipHistory.*true' src/lib/server/dialog-manager.ts 返回至少 1 行: 1 行（emitStreamChunk 第 204 行）
- [x] grep -r 'maxHistory' src/lib/server/event-bus.ts 返回 maxHistory = 100: 第 26 行 `private maxHistory = 100;`
- [x] grep -r 'latency' src/lib/server/__tests__/event-bus.test.ts 返回延迟测试: 第 133 行测试用例，验证 p95 延迟 < 500ms
- [x] npx vitest run event-bus.test.ts ws-gateway.test.ts terminal-manager.test.ts dialog-manager.test.ts 测试结果: 73/74 通过，1 个预存失败（dialog-manager "should handle tool_use, tool_result, and error chunk types" — NDJSON 最后一行无换行符导致残留在 buffer 中，非本任务引入）

## Tests
- [x] `npx vitest run src/lib/server/__tests__/event-bus.test.ts`: 10/10 通过
- [x] `npx vitest run src/lib/server/__tests__/ws-gateway.test.ts`: 17/17 通过
- [x] `npx vitest run src/lib/server/__tests__/terminal-manager.test.ts`: 26/26 通过
- [x] `npx vitest run src/lib/server/__tests__/dialog-manager.test.ts`: 20/21 通过（1 个预存失败）
- [x] `npx tsc --noEmit`: 编译通过，无类型错误

## Deviations
- dialog-manager.test.ts 的 "should handle tool_use, tool_result, and error chunk types" 测试在修改前即已失败（通过 `git stash` 验证）。原因是测试发送 3 条 NDJSON 行但最后一行没有尾随 `\n`，导致 `parseChunk` 的跨块缓冲将最后一行保留在 buffer 中。此问题与本次 skipHistory 改动无关。

## Notes
- skipHistory 意味着 OUTPUT 和 STREAM_CHUNK 事件无法通过 getHistory() 回溯，但这对高频事件是可接受的权衡
- bufferedAmount 阈值 64KB 硬编码，若需要可后续通过环境变量配置
- maxHistory 从 1000 降到 100，对于调试用途仍然足够
