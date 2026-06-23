# REQ-002: Project Radar

| Field | Value |
|-------|-------|
| **ID** | REQ-002 |
| **Feature** | Project Radar |
| **Trace** | F-002 |
| **Priority** | Must |
| **Decisions** | PM-03, PM-02, UX-02, UX-06 |

## Description

Project Radar 是 Maestro IDE 的状态导向入口。它提供实时的、可视化的项目健康仪表盘：里程碑（milestone）、阶段（phase）和步骤（step）级别的进度展示。按照 UX-02 的要求，首要交互模式为状态导向 -- 仪表盘展示当前状态并推荐下一步操作。

仪表盘 MUST 聚合多个数据源的状态：maestro 项目状态文件、活跃工作流执行状态（来自 F-005）、里程碑完成数据。"推荐下一步"功能是关键差异化特性 -- 它基于当前项目状态推算最合理的下一步操作，降低决策疲劳。

Project Radar 直接支撑 MVP 核心价值主张 "状态可视化"（PM-03）。对 maestro 现有用户，它替代了通过 CLI 输出追踪项目状态的心智模型；对 Claude Code 新用户，它提供对项目进展的即时理解。

## User Story

**As a** 开发者，**I want** 在一个可视化仪表盘上实时看到项目的里程碑、阶段和步骤进度，并获得下一步操作推荐，**So that** 我不需要在终端中手动查询项目状态，也不需要自己判断接下来该做什么。

## Acceptance Criteria

1. **AC-002-01**: Project Radar MUST 使用视觉化进度指示器（颜色、形状、图标组合）展示项目状态，MUST NOT 仅使用文字列表展示状态。进度 MUST 基于步骤状态计算百分比。

2. **AC-002-02**: 仪表盘 MUST 基于当前项目状态展示推荐下一步操作（UX-02）。推荐操作 MUST 直接链接到 Workflow Commander（F-001）中的可触发动作。当项目活跃时，MUST NOT 展示空状态或无引导的静态页面。

3. **AC-002-03**: 状态更新 MUST 通过 WebSocket 实时传播（SA-03），用户 MUST NOT 需要手动刷新以查看更新后的状态。

4. **AC-002-04**: Project Radar SHOULD 支持同时展示多个项目，并提供项目切换能力。当用户在外部终端执行 maestro 命令时，仪表盘 MUST 最终反映状态变更。

5. **AC-002-05**: 信息架构 MUST 遵循状态导向层级：项目 > 里程碑 > 阶段 > 步骤，且在左侧导航树、Project Radar 仪表盘和 Workflow Commander 进度视图中保持一致。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Project State | Consumes | `GET /api/projects/{id}/state` -- 里程碑/阶段/步骤层级及状态指示 |
| State Events | Consumes | 来自 F-005 的 WebSocket 订阅 -- 实时状态变更通知 |
| Next Step Recommendation | Emits | 基于当前状态 + 工作流目录计算的推荐；链接到 F-001 执行 |
| Project List | Consumes | `GET /api/projects` -- 项目列表及摘要状态 |

## Dependencies

- **F-005** (State Sync Engine): 实时状态事件推送
- **F-001** (Workflow Commander): 推荐下一步的执行目标
- **F-006** (Concept Translator): 术语翻译
