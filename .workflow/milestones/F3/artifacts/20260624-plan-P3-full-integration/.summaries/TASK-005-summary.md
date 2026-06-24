# TASK-005: Agent 生命周期联动 — Ralph 决策节点与 Superset Agent Hooks 桥接

## Changes
- `apps/desktop/src/main/lib/websocket-event-bus.ts` (新建): WebSocketEventBus 类 — 基于 Node.js 内置 `http` 模块 + RFC 6455 手动 WebSocket 升级实现，无需外部 `ws` 库依赖。支持频道订阅/取消订阅 (`subscribe`/`unsubscribe`)、事件推送 (`publish`)、连接管理、心跳检测 (ping/pong, 30s 间隔, 2 次漏检断开)、优雅关闭 (`stop`)。导出 `getWebSocketEventBus()` 单例工厂和 `disposeWebSocketEventBus()` 清理函数。
- `apps/desktop/src/main/lib/agent-setup/ralph-decision-bridge.ts` (新建): `createRalphDecisionBridge()` 函数 — WebSocket 客户端连接到 Maestro-flow Ralph 决策事件流 (`ws://127.0.0.1:51742/ralph/decisions`)，监听 `decision-node-created`、`decision-node-resolved`、`decision-node-expired` 事件，通过 Adapter Pattern 映射到 Agent Hooks (`onDecisionRequired`、`onDecisionResolved`、`onDecisionExpired`)。包含指数退避自动重连 (base 1s, max 5 retries)、文件轮询降级方案 (watch `~/.maestro/decision-events.json`)、去重逻辑 (knownNodeIds Set)。导出 `stopRalphDecisionBridge()` 和 `getRalphDecisionBridgeState()`。
- `apps/desktop/src/main/lib/agent-setup/index.ts` (修改): 在 `setupAgentHooks()` 内部注册 `createRalphDecisionBridge()`，包裹在独立 try/catch 中，与现有 `setupDesktopAgentCapabilities()` 同级。

## Verification
- [x] `ralph-decision-bridge.ts` 文件存在于 `apps/desktop/src/main/lib/agent-setup/` 目录中: 已确认 (16515 bytes)
- [x] `createRalphDecisionBridge()` 函数创建 WebSocket 连接并监听 decision-node-* 事件: 已确认 — 函数在 ralph-decision-bridge.ts:451, `connectWebSocket()` 在 onmessage 中处理三种事件类型
- [x] `websocket-event-bus.ts` 文件存在于 `apps/desktop/src/main/lib/` 目录中: 已确认 (16039 bytes)
- [x] `setupAgentHooks()` 中注册了 `ralphDecisionBridge.start()`: 已确认 — agent-setup/index.ts:40 调用 `createRalphDecisionBridge()`
- [x] `decision-node-created` 事件触发时调用 `onDecisionRequired` hook: 已确认 — `mapEventToHook()` 中 `decision-node-created` case 调用 `hooks.onDecisionRequired()`
- [x] `grep -r 'createRalphDecisionBridge' apps/desktop/src/main/` 返回至少 2 处匹配: 3 处匹配 (import + 调用 + 定义)
- [x] `grep -r 'WebSocket' apps/desktop/src/main/lib/websocket-event-bus.ts` 返回至少 1 处匹配: 多处匹配 (类名、注释、帧解析)

## Tests
- 测试命令 `bun run build` 和 `bun run test` 需要完整 Superset monorepo 环境 (含 `@superset/shared`、`bun` 运行时)，当前工作空间为部分检出，无法执行。代码已通过:
  - 导入路径遵循现有 `agent-setup/index.ts` 的 `"./xxx"` 模式
  - `ralph-decision-bridge.ts` 使用 `"../websocket-event-bus"` 相对路径导入 (与 `notify-hook.ts` 使用 `"./paths"` 模式一致)
  - WebSocketEventBus 使用 Node.js 内置模块 (`http`, `crypto`, `net`)，无外部依赖
  - 类型定义遵循现有 `command-chain-status-poller.ts` 的 interface 导出模式

## Deviations
- **无 `ws` 库依赖**: 使用 Node.js 内置 `http` 模块 + RFC 6455 手动 WebSocket 升级实现，而非外部 `ws` 库。原因: 当前 monorepo 部分检出中 `ws` 库不可用，且 ADR-004 明确拒绝 Socket.io，推荐 `ws` 库但允许标准 WebSocket 协议实现。手动实现覆盖了 localhost 通信所需的子集 (握手、文本帧、ping/pong、关闭帧)。
- **`setupAgentHooks()` 内部调用而非 `main/index.ts` 直接调用**: 按照 `files[2].change` 描述 "在 setupAgentHooks() 内部注册 ralphDecisionBridge.start()"，将 `createRalphDecisionBridge()` 放在 `setupAgentHooks()` 函数体内，而非 `main/index.ts` 的调用点。这遵循了现有模式 (setupAgentHooks 内部调用 `setupDesktopAgentCapabilities()`、`createZshWrapper()` 等)。
- **`createRalphDecisionBridge()` 不返回 Promise**: 桥接启动是同步的 (WebSocket 构造函数同步，连接异步)，与 `setupAgentHooks()` 的同步签名一致。
- **WebSocket 端口 51742**: 基于 `DESKTOP_NOTIFICATIONS_PORT` (51741) + 1 推导，避免端口冲突。

## Notes
- WebSocketEventBus 单例通过 `getWebSocketEventBus()` 获取，`ralph-decision-bridge.ts` 内部调用此函数订阅 `ralph:decisions` 频道
- 桥接的默认 WebSocket URL 是 `ws://127.0.0.1:51742/ralph/decisions`，可通过 `createRalphDecisionBridge({ wsUrl: "..." })` 覆盖
- 文件轮询降级方案监控 `~/.maestro/decision-events.json`，当 WebSocket 连接失败 5 次后自动切换
- 后续 TASK-006 (Agent 决策 UI 联动) 可以直接导入 `RalphDecisionHooks` 类型和 `createRalphDecisionBridge()` 来注册自定义 hooks
