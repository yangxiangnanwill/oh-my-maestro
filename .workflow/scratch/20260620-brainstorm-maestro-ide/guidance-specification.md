# Guidance Specification: Maestro IDE — AI Workflow Orchestrator for Non-CLI Developers

## §1. Project Positioning & Goals

**Product Name**: Maestro IDE (working title)

**Positioning**: Maestro IDE 是一个基于本地 Web 应用的 AI 开发工作流编排器，面向不习惯 CLI 的开发者。它将 maestro-flow 的 60+ 命令体系封装为可视化、意图驱动的交互体验，同时提供实时项目状态追踪和 Claude Code 对话入口。

**Goals**:
- 消除 CLI 命令的记忆负担和输入繁琐
- 提供实时、可视化的项目状态和工作流进度
- 作为 AI 辅助开发的统一入口，自然语言触发工作流
- 不替代终端，而是作为终端的视觉化控制台

**Target Users**:
1. maestro-flow 现有用户——觉得命令繁琐但已理解工作流概念
2. Claude Code 新用户——想用 AI 辅助开发但不会用 CLI

## §2. Concepts & Terminology

| Term | Definition | User-Facing Label |
|------|-----------|-------------------|
| maestro-flow | AI 开发工作流编排 CLI 工具 | (internal, not exposed) |
| Claude Code | Anthropic 的 CLI 编程助手，唯一 AI 后端 | AI Assistant |
| chain | 从分析→规划→执行→测试的命令序列 | Workflow |
| skill | maestro 中可调用的命令单元 | Action / Step |
| delegate | 将任务分派给外部 AI 工具执行 | (hidden, auto-triggered) |
| state machine | 项目工作流的状态追踪系统 | Project Status |
| milestone | 项目进度节点 | Goal / Milestone |
| phase | 里程碑内的执行阶段 | Stage |
| artifact | 工作流步骤产生的文件输出 | Output / Result |
| session | 一次 maestro 命令执行的运行实例 | (internal, not exposed) |

## §3. Non-Goals (Out of Scope)

1. **多模型后端支持** — 仅对接 Claude Code，不接入 OpenAI/Gemini 等
2. **团队协作功能** — 不支持多人实时协作开发
3. **完整代码编辑器** — 不内置编辑器，用户使用自己的编辑器
4. **VS Code / JetBrains 集成** — Phase 2 考虑，MVP 不涉及
5. **插件市场/生态** — MVP 不提供扩展系统

## §4. Product Manager Decisions

| ID | Decision | RFC 2119 | Rationale |
|----|----------|----------|-----------|
| PM-01 | 产品 MUST 定位为终端辅助工具，而非终端替代 | MUST | 用户仍需终端写代码；GUI 提供可视化控制台 |
| PM-02 | 产品 MUST 优先服务 maestro 现有用户，同时兼顾 Claude Code 新用户 | MUST | 现有用户有明确痛点，新用户有增长潜力 |
| PM-03 | MVP 核心价值 MUST 为工作流编排 + 状态可视化 | MUST | maestro 工作流多且复杂，封装和可视化是最大痛点 |
| PM-04 | 产品 SHOULD 支持一键触发完整工作流链路 | SHOULD | 减少命令输入频率，但保留单步执行能力 |
| PM-05 | 产品 MUST NOT 替换用户的代码编辑器 | MUST NOT | 专注工作流编排层，避免过度构建 |
| PM-06 | 产品 SHOULD 对 maestro 工作流进行分组和封装 | SHOULD | 60+ 命令需要按场景聚合，而非逐个暴露 |

## §5. System Architect Decisions

| ID | Decision | RFC 2119 | Rationale |
|----|----------|----------|-----------|
| SA-01 | 产品 MUST 采用本地 Web 应用架构（本地 HTTP/WS 服务 + 浏览器前端） | MUST | 最快 MVP 路径，跨平台，易于迭代 |
| SA-02 | Claude Code 集成 MUST 采用渐进式策略：先 CLI 子进程，后续扩展 API 直连 | MUST | CLI 子进程最快验证；API 直连为长期优化方向 |
| SA-03 | 状态同步 MUST 采用事件驱动 + WebSocket 架构 | MUST | 实时性要求高；文件轮询延迟不可接受 |
| SA-04 | 后端 MUST 使用 Node.js，前端 MUST 使用 SvelteKit | MUST | Node.js 原生支持 child_process/node-pty；SvelteKit 轻量高性能 |
| SA-05 | 终端输出 MUST 通过 xterm.js + WebSocket 流式展示 | MUST | 用户需要看到 CLI 实时输出以建立信任 |
| SA-06 | CLI 输出解析 MUST 抽象为适配器层 | MUST | 防止 CLI 版本变更导致解析失败 |
| SA-07 | 后端 SHOULD 支持 maestro ralph skills --json --quiet 格式获取结构化命令数据 | SHOULD | 已有结构化输出能力，应复用 |

## §6. UX Expert Decisions

| ID | Decision | RFC 2119 | Rationale |
|----|----------|----------|-----------|
| UX-01 | 产品 MUST 隐藏 maestro 技术概念，采用意图驱动的交互模式 | MUST | 非CLI用户不应需要理解 chain/skill/delegate 等概念 |
| UX-02 | 首要交互模式 MUST 为状态导向 | MUST | 展示当前状态 + 推荐下一步，降低决策负担 |
| UX-03 | 概念翻译层 MUST 将技术术语映射为用户友好语言 | MUST | "chain" → "Workflow", "phase" → "Stage" |
| UX-04 | 产品 SHOULD 支持分层展示模式：简单模式隐藏细节，高级模式暴露原始概念 | SHOULD | 兼顾不同技术水平用户 |
| UX-05 | 用户 MUST 能通过自然语言描述需求，系统自动路由到对应工作流 | MUST | 消除"选择正确命令"的认知负担 |
| UX-06 | 项目状态展示 MUST 使用视觉化进度指示（而非文字列表） | MUST | 状态可视化是核心价值主张之一 |

## §7. UI Designer Decisions

| ID | Decision | RFC 2119 | Rationale |
|----|----------|----------|-----------|
| UI-01 | 核心 MUST 采用双栏布局：左侧导航 + 右侧主内容区 | MUST | 双栏简洁，避免三栏信息过载 |
| UI-02 | 视觉风格 MUST 以暗色主题为默认 | MUST | 开发者习惯暗色环境 |
| UI-03 | 左侧导航 MUST 包含：项目状态树 + 工作流快捷入口 | MUST | 状态导向的核心入口 |
| UI-04 | 右侧主内容区 MUST 支持切换：对话面板 / 工作流面板 / 终端面板 | MUST | 三种核心视图按需切换 |
| UI-05 | AI 对话 MUST 支持流式输出和 Markdown 渲染 | MUST | Claude Code 输出包含代码和格式化内容 |
| UI-06 | 工作流执行 MUST 展示步骤进度条和当前步骤状态 | MUST | 用户需要实时了解工作流进展 |
| UI-07 | 审批节点 MUST 展示 diff 预览和 dry-run 结果 | SHOULD | 增强用户对 AI 操作的信任和控制 |

## §8. Cross-Role Integration

- **PM ↔ SA**: 工作流编排 (PM-04) 依赖 SA-07 的结构化命令数据
- **UX ↔ UI**: 概念隐藏 (UX-01) 需要在 UI 组件中体现翻译映射 (UI-03)
- **SA ↔ UI**: 终端流式输出 (SA-05) 需要在终端面板 (UI-04) 中集成 xterm.js
- **PM ↔ UX**: 一键触发 (PM-04) 和意图驱动 (UX-05) 需要协同设计交互流
- **SA ↔ UX**: 状态同步 (SA-03) 是状态导向交互 (UX-02) 的技术基础

## §9. Risks & Constraints

1. **CLI 输出解析脆弱性** — Claude Code CLI 输出格式可能随版本变化
2. **状态同步延迟** — WebSocket 推送与文件系统状态的时序一致性
3. **概念抽象泄漏** — 深度隐藏 maestro 概念后，错误信息可能暴露原始术语
4. **终端与 GUI 状态冲突** — 用户同时在终端和 GUI 操作可能导致状态不一致
5. **MVP 范围蔓延** — "完整 AI 开发平台"愿景容易导致过度构建

## §10. Feature Decomposition

| ID | Feature | Slug | Description | Roles | Priority |
|----|---------|------|-------------|-------|----------|
| F-001 | Workflow Commander | workflow-commander | 工作流编排面板：一键触发完整链路，可视化选择工作流类型 | PM, UX | must |
| F-002 | Project Radar | project-radar | 项目状态仪表盘：实时展示里程碑/阶段/步骤进度，推荐下一步 | PM, UX | must |
| F-003 | AI Dialog | ai-dialog | AI 对话面板：与 Claude Code 自然语言交互，流式输出，意图识别路由 | UX, UI | must |
| F-004 | Terminal Bridge | terminal-bridge | 终端桥接：xterm.js 嵌入终端，实时 CLI 输出，进程生命周期管理 | SA | must |
| F-005 | State Sync Engine | state-sync-engine | 状态同步引擎：WebSocket 实时推送 CLI 状态变更，事件驱动架构 | SA | must |
| F-006 | Concept Translator | concept-translator | 概念翻译层：技术概念映射为用户语言，分层展示模式 | UX | should |
| F-007 | Approval Gate | approval-gate | 审批门控：工作流关键节点的确认/拒绝，diff 预览，dry-run 展示 | PM, UI | should |

## §11. Appendix: Decision Tracking

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | 产品定位 | 终端辅助工具 | user |
| 2 | 目标用户 | maestro 现有用户 + Claude Code 新用户 | user |
| 3 | 核心价值 | 工作流编排 + 状态可视化 | user |
| 4 | 技术架构 | 本地 Web 应用 | user |
| 5 | AI 后端集成 | 渐进式（CLI 子进程 → API 直连） | user |
| 6 | 状态同步 | 事件驱动 + WebSocket | user |
| 7 | 概念处理 | 隐藏 + 意图驱动 | user |
| 8 | 交互模式 | 状态导向 | user |
| 9 | 布局 | 双栏（左导航 + 右内容） | user |
| 10 | 视觉风格 | 暗色主题优先 | user |
| 11 | 前端框架 | SvelteKit | design-research + default |
| 12 | 终端组件 | xterm.js | design-research + default |
| 13 | 后端运行时 | Node.js | design-research + default |
| 14 | CLI 进程管理 | node-pty | design-research + default |

## §12. Cross-Role Resolutions

### Cross-Role Resolutions (added 2026-06-20)

| ID | Type | Source(s) | Resolution | Applied to |
|---|---|---|---|---|
| C-001 | conflict | ui-designer/analysis-F-007-approval-gate.md "## Architecture" / ux-expert/analysis-F-007-approval-gate.md "## Architecture" | Approval Gate uses inline panel, not modal overlay; ApprovalModal renamed to ApprovalInline | both files patched |
| C-002 | conflict | system-architect/analysis-F-004-terminal-bridge.md "## Constraints" / ux-expert/analysis-F-004-terminal-bridge.md "## Architecture" | SA-06 scoped to simple mode; advanced mode receives dual-stream (annotated + raw) | both files patched |
| C-003 | conflict | ux-expert/analysis-F-003-ai-dialog.md "## Constraints" / product-manager/analysis-F-003-ai-dialog.md "## Architecture" | 70% confidence threshold downgraded to SHOULD for MVP; disambiguation list as fallback | both files patched |
| G-001 | gap | ux-expert/analysis.md "### Interfaces" | SA adds POST /api/intents/classify endpoint for IntentRouter backend implementation | ux-expert/analysis.md annotated, system-architect/analysis.md interface added |
| G-002 | gap | ux-expert/analysis.md "### Interfaces" | SA adds WS gate:resolved event for ApprovalResponse state propagation | ux-expert/analysis.md annotated, system-architect/analysis.md interface added |
| G-003 | gap | ux-expert/analysis.md "### Interfaces" | SA Translator.translate envelope defines server-client contract; client-side shouldHide controls visibility | ux-expert/analysis.md annotated, system-architect/analysis.md interface added |
| S-001 | synergy | All four roles — concept leak risk | Unified defense: SA middleware + UI ConceptTranslator + UX rendering rules + shared regression test | 4 files annotated |
| S-002 | synergy | system-architect, product-manager, ux-expert — state desync | Dual-source state model validated against PM 99% accuracy + UX 500ms latency as single acceptance set | 2 files annotated |
| S-003 | synergy | system-architect, ux-expert, ui-designer — Windows ConPTY | Terminal designs incorporate Windows-specific constraints (SIGINT for stop, resize error recovery) | 2 files annotated |
