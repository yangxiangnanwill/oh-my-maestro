# TASK-005 Summary: EventBus skipHistory + WSGateway backpressure

## Status: ✅ COMPLETED

## Files Modified
- `src/lib/server/event-bus.ts` — publish() 方法签名新增 `options?: { skipHistory?: boolean }` 参数；skipHistory=true 时跳过 history.push 和长度裁剪
- `src/lib/server/ws-gateway.ts` — sendToClient() 方法新增 bufferedAmount > 16384 的 backpressure 检查，超阈值时 console.warn 并 return
- `src/lib/server/__tests__/event-bus.test.ts` — 新增 2 个测试：skipHistory 不存储到 history、skipHistory 仍通知订阅者
- `src/lib/server/__tests__/ws-gateway.test.ts` — 新增 2 个测试：bufferedAmount 超阈值丢弃消息、低于阈值正常发送

## Convergence Criteria Verification
- [x] EventBus.publish() 方法签名变更为 publish<T>(type, channel, payload, source?, options?: { skipHistory?: boolean }) — ✅ 已修改
- [x] publish() 中 options?.skipHistory === true 时不执行 history.push 和长度裁剪 — ✅ 已实现
- [x] publish() 中 skipHistory=true 时 subscriber 通知逻辑正常执行 — ✅ 已验证
- [x] sendToClient() 检查 client.ws.bufferedAmount > 16384 — ✅ 已实现
- [x] backpressure 触发时 console.warn 日志包含 client.id — ✅ 已实现
- [x] event-bus.test.ts 新增 skipHistory 测试 — ✅ 2 个新测试
- [x] ws-gateway.test.ts 新增 backpressure 测试 — ✅ 2 个新测试

## Test Results
- EventBus: 6/6 passing (4 original + 2 new)
- WSGateway: 14/14 passing (12 original + 2 new)
- Total: 20/20 passing

## Key Decisions
1. options 参数放在末尾，source 保持默认值 'server'，完全向后兼容
2. backpressure 阈值 16384 (16KB)，符合任务规格
3. console.warn 而非 console.error — backpressure 是预期内的流控行为

## Deviations
None — 完全按照计划执行
