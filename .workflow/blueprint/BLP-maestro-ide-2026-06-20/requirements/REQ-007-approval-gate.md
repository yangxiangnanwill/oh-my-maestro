# REQ-007: Approval Gate

| Field | Value |
|-------|-------|
| **ID** | REQ-007 |
| **Feature** | Approval Gate |
| **Trace** | F-007 |
| **Priority** | Should |
| **Decisions** | PM-01, PM-04, UI-07, C-001 |

## Description

Approval Gate 为自动化工作流执行实现信任层。当工作流步骤涉及潜在破坏性操作（文件修改、命令执行、部署）时，系统 MUST 暂停并展示提议的操作供用户审查。

该功能直接应对设计研究中的 "审批绕过" 风险：如果 GUI 在不展示 diff 或计划的情况下自动批准所有 CLI 操作，安全网即被移除。Cline 和 Claude Code 的 "agent-in-sidebar with approval gate" 模式是参考实现。

从产品角度，Approval Gate 是 MVP 的 "should" 优先级功能，但对用户信任至关重要。产品决策是 Approval Gate MUST 对修改文件或执行命令的工作流可用，但审批粒度（按步骤 vs 按工作流）SHOULD 可配置。

> **Cross-Role Resolution (C-001)**: Approval Gate 使用 inline panel 展示，而非 modal overlay；ApprovalModal 重命名为 ApprovalInline。

> **Cross-Role Gap (G-002)**: SA 需要添加 `gate:resolved` WebSocket 事件用于 ApprovalResponse 状态传播。

## User Story

**As a** 开发者，**I want** 在工作流执行到可能修改文件或执行命令的步骤时，系统暂停并展示变更预览（diff 和 dry-run 结果）供我审查，**So that** 我能对 AI 的自动化操作保持控制，避免意外的破坏性变更。

## Acceptance Criteria

1. **AC-007-01**: Approval Gate MUST 在涉及文件修改或命令执行的步骤暂停工作流执行，等待用户确认（UI-07）。系统 MUST NOT 在未经用户明确同意的情况下自动批准破坏性操作。

2. **AC-007-02**: 系统 MUST 为文件修改步骤展示 diff 预览（UI-07）。系统 SHOULD 在可用时展示 dry-run 结果（UI-07, PM-04）。审批界面 MUST 使用 inline panel 展示（非 modal overlay），包含三个审查标签页（Summary、Diff Preview、Dry-Run Result）提供渐进式细节。

3. **AC-007-03**: 用户 MUST 能批准、拒绝或请求修改提议的操作。高风险操作 MUST 在 Approve 按钮之外要求额外的确认复选框。拒绝操作 MUST 要求填写原因字段，以将上下文反馈到 AI 迭代循环。

4. **AC-007-04**: 审批粒度（按步骤 vs 按工作流批量）SHOULD 可由用户配置。用户 SHOULD 能在工作流中一次性批准所有剩余步骤。Approval Gate MUST NOT 阻塞整个界面 -- 用户 SHOULD 能在审批待定时与其他面板交互。

5. **AC-007-05**: Approval Gate 状态机 MUST 遵循：pending -> presented -> approved/rejected/expired。焦点管理 MUST 在审批触发时移至 Approval Gate，并在用户操作后返回先前焦点点。Diff 预览 MUST 支持屏幕阅读器导航。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Approval Request | Consumes | 来自工作流引擎的事件 -- `{ stepId, action, diff?, dryRunResult?, riskLevel }` |
| User Decision | Emits | Approve / Reject / Modify -- 转发到工作流引擎以继续或中止 |
| Diff Preview | Consumes | `GET /api/approvals/{id}/diff` -- 文件变更 diff 供用户审查 |
| Dry-Run Result | Consumes | `GET /api/approvals/{id}/dry-run` -- 模拟执行输出 |
| `WS event: gate:resolved` | Backend -> Frontend | `{ gateId, decision, modifiedParams? }` (G-002 gap resolution) |

## Dependencies

- **F-001** (Workflow Commander): 工作流暂停/恢复控制
- **F-005** (State Sync Engine): 审批状态事件传播
- **F-006** (Concept Translator): 审批描述翻译
