# EPIC-002: Core MVP -- Project Radar + Workflow Commander

**MVP**: Yes (核心价值交付)
**Phase**: Core MVP
**Dependencies**: EPIC-001 (State Sync Engine 提供实时推送; Concept Translator 处理术语翻译)
**Trace**: F-002, F-001 -- REQ-003, REQ-004

## Description

Core MVP Epic 交付产品的核心价值主张 (PM-03): 工作流编排 + 状态可视化. Project Radar (F-002) 是应用的状态导向入口, 用户打开应用即看到当前项目状态和推荐下一步; Workflow Commander (F-001) 是工作流编排面板, 用户可按场景分组浏览和一键触发工作流.

这两个功能形成核心闭环: 用户在 Project Radar 看到状态 -> 点击推荐下一步 -> Workflow Commander 触发工作流 -> Project Radar 实时更新状态. 此 Epic 完成后, 产品首次对用户可用.

---

## ST-006: 项目状态树可视化

**As a** 开发者
**I want** 在仪表盘上实时看到项目的 milestone/phase/step 层次结构和进度状态
**So that** 我不用在终端中手动查询就能了解项目全貌

### Acceptance Criteria

1. 左侧导航展示项目列表; 选中项目后, 右侧主内容区显示 milestone > phase > step 层次状态树
2. 每个节点显示视觉化进度指示 (进度条 + 状态图标: completed/running/pending/failed), 非纯文字列表 (UX-06)
3. 状态变更通过 WebSocket 实时推送; 前端收到 `project:state-update` 事件后 300ms 内完成渲染
4. 支持至少 100 个 milestone 的项目, 查询响应时间 < 500ms

**Size**: L
**Trace**: F-002 -- REQ-003 (UX-06, UX-02, SA-03)

---

## ST-007: 推荐下一步 + 触发链接

**As a** 开发者
**I want** 仪表盘根据当前项目状态自动推荐最合理的下一步操作, 并提供一键触发入口
**So that** 我不需要自己判断接下来该做什么, 减少决策负担

### Acceptance Criteria

1. 项目状态页显示 Recommendation Card, 包含推荐动作名称、对应 Workflow ID、推荐原因说明
2. 推荐算法基于当前状态 + workflow 图, 不推荐前置条件已完成的步骤; 推荐至少 1 个、最多 3 个选项
3. 点击推荐卡片直接跳转 Workflow Commander 触发对应工作流; 跳转时预填参数
4. 无可用推荐时 (如项目已完成所有步骤), 显示 "所有目标已完成" 状态

**Size**: M
**Trace**: F-002 -- REQ-003 (UX-02 状态导向, PM-08 推荐下一步)

---

## ST-008: 场景分组工作流目录

**As a** 开发者
**I want** 按开发场景 (如 "开始新功能"、"调试问题"、"审查并发布") 浏览和选择工作流, 而非面对 60+ 命令列表
**So that** 我能快速找到想要的工作流, 不需要记住命令名称

### Acceptance Criteria

1. `GET /api/workflows` 返回按场景分组的工作流列表, 每组包含名称、描述、预估步骤数、所需上下文
2. 工作流目录数据来源于 `maestro ralph skills --json --quiet` (SA-07), 动态生成, 非硬编码
3. 简单模式下工作流名称使用 Concept Translator 翻译后的用户友好标签; 高级模式显示原始名称
4. 每个工作流卡片显示一键触发按钮; 点击后调用 `POST /api/workflows/:id/execute`

**Size**: M
**Trace**: F-001 -- REQ-004 (PM-06 场景分组, PM-04 一键触发, SA-07)

---

## ST-009: 工作流执行 + 步骤进度追踪

**As a** 开发者
**I want** 触发工作流后实时看到每个步骤的执行状态 (开始/完成/出错), 并能取消正在运行的工作流
**So that** 我了解工作流进展, 并在出错时能及时干预

### Acceptance Criteria

1. 工作流触发后, 后端为每次执行创建独立 child process + 唯一 executionId; 步骤状态通过 `workflow:step-update` 事件推送
2. 前端显示步骤级进度条: 当前步骤高亮, 已完成步骤标绿, 失败步骤标红; 收到事件后 200ms 内更新
3. 支持取消: 用户点击取消按钮 -> 后端发送 SIGINT 到 child process -> 前端收到 `workflow:cancelled` 事件
4. CLI stdout/stderr 必须经过 CLI Adapter 层解析, 原始 CLI 文本不直接发送到前端 (SA-06)

**Size**: L
**Trace**: F-001 -- REQ-004 (SA-06, SA-07, PM-04)

---

## ST-010: Project Radar 与 Workflow Commander 联动

**As a** 开发者
**I want** 在 Project Radar 看到推荐并触发工作流后, 状态变化自动反映回仪表盘
**So that** 我在一个闭环中完成 "查看状态 -> 执行动作 -> 查看结果" 的完整流程

### Acceptance Criteria

1. 从 Project Radar 推荐卡片触发工作流后, 自动切换到 Workflow Commander 面板显示执行进度
2. 工作流步骤完成时, Project Radar 的状态树同步更新 (通过 State Sync Engine 的 `project:state-update` 事件)
3. 工作流执行失败时, Project Radar 对应步骤标红, 推荐区域显示 "重试" 或 "查看错误" 选项
4. 端到端测试: 打开应用 -> 查看推荐 -> 触发工作流 -> 观察步骤进度 -> 状态树更新 -> 全流程 < 5 秒

**Size**: M
**Trace**: F-001 + F-002 -- REQ-003 + REQ-004 (PM-03 核心闭环)
