# REQ-005: State Sync Engine

| Field | Value |
|-------|-------|
| **ID** | REQ-005 |
| **Feature** | State Sync Engine |
| **Trace** | F-005 |
| **Priority** | Must |
| **Decisions** | PM-03, SA-03, S-002 |

## Description

State Sync Engine 是使产品核心价值主张 "实时状态可视化"（PM-03）成为可能的技术骨干。从产品角度，该功能至关重要，因为它直接决定用户是否能信任 GUI 反映真实状态。

关键产品关注点是 "状态同步脱节" 风险：如果 GUI 因用户在外部终端运行 maestro 命令而展示过期数据，信任即被打破。State Sync Engine MUST 优雅处理此场景。

按照 SA-03，架构为事件驱动 + WebSocket。产品要求是状态变更 MUST 在用户感知为瞬时的时限内传播到 GUI（活跃工作流亚秒级，外部变更近实时）。

> **Cross-Role Synergy (S-002)**: 状态同步准确率指标（99% 在 5s 内）与 SA 双源模型及 UX 500ms 延迟标准对齐 -- 统一验收标准。

## User Story

**As a** 开发者，**I want** GUI 中的项目状态始终与实际状态保持同步，包括我在外部终端执行的 maestro 命令产生的变更，**So that** 我能信任 GUI 展示的信息，不需要反复在终端中手动验证。

## Acceptance Criteria

1. **AC-005-01**: 状态变更 MUST 通过 WebSocket 实时传播到 GUI（SA-03）。Event Bus MUST 在事件发布后 100ms 内将事件投递到所有已订阅的 WebSocket 客户端。活跃工作流的状态变更 MUST 在 500ms 内反映到 UI。

2. **AC-005-02**: 引擎 MUST 检测由外部 CLI 使用（用户在自己的终端运行 maestro）导致的状态变更，并在 GUI 中反映。引擎 MUST NOT 仅依赖文件轮询 -- 活跃工作流 MUST 使用事件驱动更新（SA-03）。外部 CLI 变更检测延迟 SHOULD 不超过 5 秒，准确率 SHOULD 达到 99%。

3. **AC-005-03**: 事件 MUST 是幂等的 -- 重复事件 MUST NOT 导致错误的 UI 状态。通道内事件顺序 MUST 保持 FIFO；跨通道顺序不做保证。环形缓冲区 MUST 保留每个通道至少最近 1000 个事件。

4. **AC-005-04**: WebSocket 连接 MUST 实现 30 秒间隔的心跳（ping/pong）以检测过期连接。引擎 SHOULD 提供状态快照 API 用于初始页面加载和重连场景。快照服务 MUST 每 30 秒在每个活跃通道上发布一次全量状态快照。

5. **AC-005-05**: WebSocket 网关 MUST 支持至少 10 个并发连接（单用户本地应用）。新 WebSocket 连接时，网关 MUST 为每个通道重放最多 100 个近期事件。网络中断后，GUI MUST 重连并接收状态快照，MUST NOT 丢失事件。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `EventBus.publish(channel, event)` | Internal | `event: { type, timestamp, payload }` |
| `EventBus.subscribe(channel, handler)` | Internal | 返回 `() => void` (取消订阅) |
| `WS connect: /ws` | Frontend -> Backend | 查询参数 `channels=workflow,project` 用于订阅 |
| `WS message: subscribe` | Frontend -> Backend | `{ op: "subscribe", channels: string[] }` |
| `WS message: event` | Backend -> Frontend | `{ channel, event }` |
| `WS message: snapshot` | Backend -> Frontend | `{ channel, fullState }` |
| State Query | Consumes | `GET /api/state/{project}` -- 当前快照用于初始加载或重连 |
| File Watcher | Consumes | 后端文件系统监视器 -- 检测外部 CLI 变更 |

## Dependencies

- **Node.js EventEmitter**: 事件总线基础
- **WebSocket (ws)**: 客户端-服务端实时通信
- **File System Watcher**: 外部 CLI 变更检测
