# EPIC-003: Interaction -- Terminal Bridge + AI Dialog

**MVP**: Yes (增强交互能力)
**Phase**: Interaction
**Dependencies**: EPIC-001 (State Sync Engine 传播进程事件; Concept Translator 处理术语), EPIC-002 (AI Dialog 意图路由依赖 Workflow Commander; Terminal Bridge 关联工作流子进程)
**Trace**: F-004, F-003 -- REQ-005, REQ-006

## Description

Interaction Epic 增强产品的交互能力. Terminal Bridge (F-004) 在浏览器中嵌入终端, 让用户看到 maestro 工作流的实时 CLI 输出, 建立对自动化操作的信任; AI Dialog (F-003) 提供自然语言交互入口, 用户可以用日常语言描述需求, 系统自动路由到对应工作流或 Claude Code 对话.

Terminal Bridge 是透明度层 (PM-01: 终端辅助工具, 非替代), AI Dialog 是可访问性层 (UX-05: 自然语言消除认知负担). 两者都不是核心 MVP 价值, 但它们让核心价值 (工作流编排 + 状态可视化) 更易触达.

---

## ST-011: xterm.js 嵌入终端 + PTY 流式输出

**As a** 开发者
**I want** 在应用内看到 maestro 工作流的实时 CLI 输出
**So that** 我了解自动化操作在做什么, 建立对 GUI 触发操作的可信度

### Acceptance Criteria

1. 右侧内容区可切换到 "Terminal" 面板, 使用 xterm.js 渲染 node-pty 伪终端输出
2. PTY 输出在 30ms 内流式到达 xterm.js; 用户感知为实时输出 (无可见延迟)
3. 终端面板支持基础交互: 滚动、复制文本; 不支持 tab/split/profile 等完整终端特性
4. 最多支持 5 个并发终端会话; 超出时提示用户关闭已有会话

**Size**: L
**Trace**: F-004 -- REQ-005 (SA-05, PM-01 透明度)

---

## ST-012: 终端进程生命周期管理

**As a** 开发者
**I want** 终端进程在创建、运行、退出、崩溃时有清晰的状态指示, 且 WebSocket 断线后资源自动释放
**So that** 我不会遇到僵尸进程或资源泄漏

### Acceptance Criteria

1. `POST /api/terminals` 创建新 PTY 会话返回 terminalId; `DELETE /api/terminals/:id` 终止进程并返回 exitCode
2. 进程退出 (正常或崩溃) 时前端收到 `term:exit` 事件, 终端面板显示退出状态和 exit code
3. WebSocket 断连后 5 秒内, 后端清理所有关联 PTY 进程和资源
4. Windows ConPTY 兼容: 捕获 conpty 特有错误并记录日志, 不导致服务崩溃 (S-003)

**Size**: M
**Trace**: F-004 -- REQ-005 (SA-04, S-003 Windows ConPTY)

---

## ST-013: AI Dialog 流式对话界面

**As a** 开发者
**I want** 通过自然语言与 AI 助手对话, 并看到流式 Markdown 渲染的回复 (含代码块)
**So that** 我不需要记忆命令语法, 用日常语言就能获取帮助

### Acceptance Criteria

1. 右侧内容区可切换到 "Dialog" 面板; 用户输入自然语言消息, 回复通过 WebSocket `dialog:stream-chunk` 事件流式渲染
2. 流式输出支持 Markdown 渲染, 包括代码块 (语法高亮)、列表、加粗等格式
3. 每个对话 session 对应一个 Claude Code CLI 子进程; 空闲 10 分钟自动终止并释放资源
4. Claude Code CLI stdout 到达后 50ms 内, 流式 chunk 发送到前端

**Size**: L
**Trace**: F-003 -- REQ-006 (UX-05, UI-05)

---

## ST-014: Intent Router 意图识别与路由

**As a** 开发者
**I want** 在对话框中输入 "我想添加登录功能" 后, 系统自动识别我的意图并路由到正确的工作流或 AI 对话
**So that** 我不需要知道该选哪个工作流, 系统帮我找到

### Acceptance Criteria

1. Intent Router 将用户消息分类为三类: workflow (触发工作流)、status (查询状态)、freeform (自由对话); 路由延迟 < 100ms
2. Workflow 意图: 发送 `dialog:intent-routed` 事件, 包含目标 workflowId, 前端提示用户确认后调用 Workflow Commander
3. Status 意图: 查询 Project Radar 当前状态并在对话中展示摘要
4. 低置信度 (< 70%) 时: 显示消歧列表, 让用户从 2-3 个候选意图中选择 (Resolution C-003)

**Size**: L
**Trace**: F-003 -- REQ-006 (UX-05, PM-09, Resolution C-003)

---

## ST-015: AI Dialog 与 Workflow Commander / Terminal Bridge 协同

**As a** 开发者
**I want** 通过自然语言触发工作流后, 对话面板和终端面板同步展示执行状态
**So that** 我在一个自然的工作流中完成从意图到执行的完整过程

### Acceptance Criteria

1. AI Dialog 触发 workflow 意图并经用户确认后, 自动调用 Workflow Commander 执行管线; 对话面板显示 "正在执行: {workflow 名称}"
2. 工作流执行期间, Terminal 面板自动切换到对应子进程的输出流 (如用户已打开终端面板)
3. 工作流完成后, 对话面板显示执行结果摘要 (成功/失败/步骤概览); 用户可继续对话
4. AI Dialog 不是触发工作流的唯一入口 -- Workflow Commander 始终可直接访问 (PM-09)

**Size**: M
**Trace**: F-003 + F-001 -- REQ-006 + REQ-004 (PM-09, UX-05)
