# TASK-002: 修复 HIGH：WSGateway 多客户端消息对象共享导致 payload 污染

## Changes
- `src/lib/server/ws-gateway.ts`: 将 `WSMessage` 对象创建从 `broadcastEvent` 方法的 `for` 循环外部（原第125-130行）移动到 `for` 循环内部（现第126-131行），使每个客户端迭代创建独立的消息对象

## Verification
- [x] `const message: WSMessage = { ... }` 声明位于 `for (const client of this.clients.values())` 循环体内部：行126-131在行125的for循环体内
- [x] `message.payload = translated` 赋值不再影响其他客户端的消息对象：每次迭代创建独立的message对象，行140的修改只影响当前客户端
- [x] TypeScript 编译无错误：ws-gateway.ts 零错误（项目中其他文件有4个预存错误，与本次修改无关）

## Tests
- [x] `npx tsc --noEmit 2>&1`: ws-gateway.ts 无编译错误（4个预存错误在 delegate-executor.ts 和 state-sync.ts 中）

## Deviations
- 无

## Notes
- 修复前：一个共享的message对象在循环外创建，所有客户端迭代共享同一引用；虽然当前同步代码中JSON.stringify立即序列化所以不会实际出问题，但如果未来引入异步操作，后一个客户端的translated payload会覆盖前一个
- 修复后：每个客户端迭代独立创建message对象，消除了共享可变状态的风险
- 性能影响可忽略（多一次对象字面量分配/迭代，客户端数量通常 < 10）
