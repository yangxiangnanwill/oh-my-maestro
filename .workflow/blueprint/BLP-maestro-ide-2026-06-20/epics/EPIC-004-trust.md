# EPIC-004: Trust -- Approval Gate

**MVP**: Partial (MVP 仅交付高风险操作审批; 可配置粒度和 dry-run 为后续迭代)
**Phase**: Trust
**Dependencies**: EPIC-001 (State Sync Engine 推送审批状态变更; Concept Translator 处理审批 UI 术语), EPIC-002 (Approval Gate 拦截 Workflow Commander 执行步骤; diff 预览读取项目文件状态)
**Trace**: F-007 -- REQ-007

## Description

Trust Epic 交付审批门控 (Approval Gate), 为自动化工作流执行建立信任层. 当工作流步骤涉及文件修改或命令执行等破坏性操作时, 系统暂停执行并展示 diff 预览, 等待用户确认后才继续. 这直接解决了 "AI 在我背后改文件" 的信任问题.

Approval Gate 是 "should" 优先级 (非 MVP blocking), 但对生产使用至关重要. MVP 阶段聚焦高风险操作 (文件修改) 的 per-step 审批; 可配置粒度 (per-workflow batch) 和 dry-run 预览作为后续迭代.

参考实现: Cline 和 Claude Code 的 "agent-in-sidebar with approval gate" 模式.

---

## ST-016: 审批门控检测 + 状态机

**As a** 开发者
**I want** 当工作流执行到需要修改文件的步骤时, 系统自动暂停并通知我审批
**So that** 破坏性操作不会在我不知情的情况下自动执行

### Acceptance Criteria

1. Gate Detector 监听 `workflow:step-update` 事件; 当步骤标记 `requiresApproval: true` 时, 暂停 child process 并发布 `gate:pending` 事件
2. Approval 状态机: pending -> approved (恢复执行) / rejected (发送 SIGINT, 标记 workflow 已取消) / expired (10 分钟超时, 默认 rejected)
3. 系统绝不自动审批标记为 `requiresApproval: true` 的步骤 (PM-10)
4. 审批决策记录审计日志: 时间戳 + 用户身份 + 决策结果

**Size**: M
**Trace**: F-007 -- REQ-007 (PM-10, UI-07)

---

## ST-017: Diff 预览 + 内联审批面板

**As a** 开发者
**I want** 在审批前看到即将修改的文件 diff 预览, 并在内联面板中直接批准或拒绝
**So that** 我能在知情的前提下做出决策, 且审批操作不打断工作流上下文

### Acceptance Criteria

1. 审批触发时, 右侧内容区显示内联 Approval Panel (非模态弹窗, Resolution C-001); 包含 diff 预览区域和 Approve/Reject 按钮
2. `GET /api/gates/:id/diff` 返回 DiffView, 包含文件级 diff 列表; 二进制文件显示 "binary file changed" 占位
3. 简单模式下 diff 中的 maestro 术语通过 Concept Translator 翻译; 高级模式保留原始术语 (Resolution C-002: SA-06 适配器层作用域限定)
4. 用户批准: 后端恢复 child process, 前端收到 `gate:resolved` 事件; 用户拒绝: 显示取消原因, 工作流标记为 cancelled

**Size**: L
**Trace**: F-007 -- REQ-007 (UI-07, Resolution C-001, Resolution C-002)

---

## ST-018: Approval Gate 与 Workflow Commander 集成

**As a** 开发者
**I want** 在 Workflow Commander 面板执行工作流时, 遇到审批节点自动弹出审批面板, 审批后无缝继续
**So that** 审批是工作流执行的自然组成部分, 不需要切换到单独页面

### Acceptance Criteria

1. Workflow Commander 步骤进度条中, 审批节点显示 "Awaiting Approval" 状态 (暂停图标); 点击可展开内联审批面板
2. 审批通过后, Workflow Commander 进度条自动继续; 审批拒绝后, 工作流步骤标记为 cancelled, 显示拒绝原因
3. 超时未审批 (10 分钟): 自动拒绝, 工作流标记为 cancelled, 前端显示超时提示
4. 端到端测试: 触发含审批步骤的工作流 -> 步骤到达审批节点暂停 -> 查看 diff -> 批准 -> 工作流继续完成

**Size**: M
**Trace**: F-007 + F-001 -- REQ-007 + REQ-004 (PM-10)
