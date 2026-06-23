# EPIC-001: Foundation -- State Sync Engine + Concept Translator

**MVP**: Yes (核心前置依赖)
**Phase**: Foundation
**Dependencies**: 无
**Trace**: F-005, F-006 -- REQ-001, REQ-002

## Description

Foundation Epic 交付两个横切基础设施层: State Sync Engine (F-005) 提供事件驱动的实时状态同步能力, Concept Translator (F-006) 提供技术概念到用户语言的翻译能力. 这两个功能是所有后续 Epic 的前置依赖 -- 没有 State Sync Engine, 所有实时状态展示无从实现; 没有 Concept Translator, 所有用户可见文本无法满足 UX-01 "隐藏技术概念" 的要求.

此 Epic 本身不直接交付用户可感知的价值, 但它是整个产品的基石. 按照 PM-07 的交付顺序, Foundation 必须先于 Core MVP 完成.

---

## ST-001: EventBus 核心发布/订阅实现

**As a** 后端开发者
**I want** 一个带类型化 channel 的事件总线, 支持 workflow / project / dialog / terminal 四个频道
**So that** 所有后端服务可以通过统一的事件机制发布和订阅状态变更, 而不产生直接耦合

### Acceptance Criteria

1. `EventBus.publish(channel, event)` 能向指定 channel 发布事件, 事件包含 `type`, `timestamp`, `payload` 字段; 同 channel 内事件 FIFO 有序
2. `EventBus.subscribe(channel, handler)` 注册订阅, 返回 unsubscribe 函数; 调用 unsubscribe 后不再收到该 channel 事件
3. 支持 `workflow:*`, `project:*`, `dialog:*`, `terminal:*` 四个 typed channel; 发布到不存在的 channel 抛出明确错误
4. 单元测试: 1000 事件/秒突发发送, 验证无事件丢失且顺序正确

**Size**: M
**Trace**: F-005 -- REQ-001 (SA-03 事件驱动架构)

---

## ST-002: WebSocket Gateway + 事件推送

**As a** 前端应用
**I want** 通过 WebSocket 连接接收后端事件推送, 并能按 channel 过滤订阅
**So that** 我只接收关心的状态变更, 实现高效的前端更新

### Acceptance Criteria

1. 前端连接 `ws://localhost:{port}/ws?channels=workflow,project` 后, 仅收到指定 channel 的事件
2. 后端事件发布后 100ms 内, 所有已订阅该 channel 的 WebSocket 客户端必须收到事件
3. WebSocket 实现心跳机制 (ping/pong, 30 秒间隔), 60 秒无响应自动断开并清理资源
4. 至少支持 10 个并发 WebSocket 连接 (单用户本地应用场景)

**Size**: L
**Trace**: F-005 -- REQ-001 (SA-03, S-002: 99% 准确率 + 500ms 延迟)

---

## ST-003: Event Store + 断线重连恢复

**As a** 前端应用
**I want** 在 WebSocket 断线重连后能收到近期遗漏的事件, 并定期获得完整状态快照
**So that** 短暂网络中断不会导致 UI 状态与后端不一致

### Acceptance Criteria

1. 内存环形缓冲区保留每个 channel 最近 1000 条事件; 新连接时回放最近 100 条
2. 每 30 秒发布一次 `state:snapshot` 完整状态快照; 客户端用快照进行状态对账
3. 断线重连后, 客户端先收到 snapshot, 再收到 snapshot 之后的事件; 验证状态一致
4. 集成测试: 断线期间发布 50 条事件, 重连后验证客户端最终状态与后端一致

**Size**: L
**Trace**: F-005 -- REQ-001 (SA-03, SA-05 状态同步可靠性)

---

## ST-004: 概念翻译注册表 + 中间件

**As a** 产品负责人
**I want** 所有 maestro 技术术语 (chain, skill, delegate, phase, artifact 等) 自动映射为用户友好语言
**So that** 简单模式下用户无需理解 maestro 内部概念即可使用产品

### Acceptance Criteria

1. `translations.json` 覆盖 guidance-specification Section 2 全部术语: chain->Workflow, skill->Action, delegate->(hidden), phase->Stage, artifact->Output, milestone->Goal, session->(hidden)
2. Concept Translator 中间件拦截所有 REST 和 WebSocket 响应, 对 JSON payload 递归执行术语替换; 简单模式下无原始技术术语泄漏
3. CLI 错误信息通过翻译层后再发送到前端; 未经翻译的错误消息不得到达 UI
4. 添加新翻译条目不需要重启服务; 支持 hot-reload (文件变更后 5 秒内生效)

**Size**: M
**Trace**: F-006 -- REQ-002 (UX-01, UX-03, S-001 概念泄漏防御)

---

## ST-005: 分层展示模式 (简单/高级切换)

**As a** 不同技术水平的用户
**I want** 在简单模式和高级模式之间切换, 简单模式隐藏技术细节, 高级模式显示原始术语
**So that** Claude Code 新用户看到友好语言, maestro 老用户可以看到他们熟悉的技术概念

### Acceptance Criteria

1. 前端 `X-Detail-Level: simple|advanced` 请求头控制翻译行为; 默认 simple
2. 简单模式: 隐藏 delegate/session 等内部概念; chain 显示为 "Workflow", phase 显示为 "Stage"
3. 高级模式: 保留原始术语, 同时显示用户友好标签 (如 "Workflow (chain)")
4. 端到端测试: 切换模式后, 所有面板 (Project Radar, Workflow Commander, AI Dialog, Terminal Bridge) 的术语同步变更

**Size**: S
**Trace**: F-006 -- REQ-002 (UX-04, PM-02 双用户段策略)
