# REQ-001: Workflow Commander

| Field | Value |
|-------|-------|
| **ID** | REQ-001 |
| **Feature** | Workflow Commander |
| **Trace** | F-001 |
| **Priority** | Must |
| **Decisions** | PM-03, PM-04, PM-06, UX-01, UX-05 |

## Description

Workflow Commander 是 Maestro IDE 的核心价值交付面。它将 maestro 的 60+ 命令体系封装为基于开发场景的工作流分组，每个分组代表一条完整的 chain（analysis -> planning -> execution -> testing），用户通过单一操作即可触发整条链路。

工作流 MUST 按开发场景组织（如 "Start a new feature"、"Debug an issue"、"Review and ship"），而非按 maestro 命令分类法展示。每个场景组内部映射到一条或多条 maestro chain，但用户 SHALL NOT 看到原始命令名称。

Workflow Commander 依赖 SA-07 的结构化命令数据（`maestro ralph skills --json --quiet`）填充工作流目录，并依赖 F-005（State Sync Engine）实时反映执行状态。

## User Story

**As a** 不习惯 CLI 的开发者，**I want** 通过一个可视化面板选择并触发完整的工作流链路，**So that** 我不需要记忆和输入 60+ 个 maestro 命令，只需按场景选择即可完成从分析到测试的完整开发流程。

## Acceptance Criteria

1. **AC-001-01**: 系统 MUST 将工作流按开发场景分组展示（如 "Start a new feature"、"Debug an issue"、"Review and ship"），而非按 maestro 命令分类法展示。原始 maestro 命令名称 MUST NOT 作为主要标签出现。

2. **AC-001-02**: 用户 MUST 能通过单一操作（一次点击或一次确认）触发完整的工作流链路，系统自动执行 chain 中的所有步骤。高级用户 SHOULD 能在高级模式下逐步执行工作流中的单个步骤。

3. **AC-001-03**: 工作流目录 MUST 从 maestro 的结构化输出（`maestro ralph skills --json --quiet`）动态生成，MUST NOT 硬编码工作流列表。

4. **AC-001-04**: 工作流执行状态 MUST 通过 WebSocket 事件实时更新（SA-03），包括步骤进度、完成状态和错误状态。用户 MUST NOT 需要手动刷新以查看状态变更。

5. **AC-001-05**: 当工作流步骤需要用户确认时，Workflow Commander MUST 将审批请求委托给 F-007（Approval Gate）处理。工作流中断时，部分状态 MUST 可见且可恢复。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Workflow Catalog | Consumes | `GET /api/workflows` -- 返回按场景分组的工作流列表，含元数据（名称、描述、预估步骤数、所需上下文） |
| Workflow Trigger | Emits | `POST /api/workflows/{id}/execute` -- 启动工作流链路；接受可选参数（目标范围、dry-run 标志） |
| Execution Status | Consumes | 来自 F-005 的 WebSocket 事件流 -- 步骤进度、完成、错误状态 |
| Approval Request | Emits | 委托给 F-007（Approval Gate）处理需要用户确认的工作流步骤 |

## Dependencies

- **F-005** (State Sync Engine): 实时执行状态推送
- **F-006** (Concept Translator): 技术术语翻译为用户语言
- **F-007** (Approval Gate): 审批节点处理
- **SA-07**: 结构化命令数据源
