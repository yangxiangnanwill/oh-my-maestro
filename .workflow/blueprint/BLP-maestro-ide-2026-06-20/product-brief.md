---
session_id: BLP-maestro-ide-2026-06-20
type: product-brief
status: draft
created_at: 2026-06-20T21:00:00+08:00
---

# Maestro IDE -- Product Brief

## 1. Vision & Positioning

Maestro IDE 是一个面向非 CLI 开发者的 AI 开发工作流编排器。它将 maestro-flow 的 60+ 命令体系封装为可视化、意图驱动的交互体验，同时提供实时项目状态追踪和 Claude Code 对话入口。

**核心定位**：终端的视觉化控制台，而非终端替代。用户仍使用自己的编辑器写代码、使用终端执行命令；Maestro IDE 提供的是工作流编排层和状态可视化层，让不习惯 CLI 的开发者也能高效使用 maestro 的完整工作流能力。

**产品愿景**：让 AI 辅助开发工作流像使用 IDE 一样直观 -- 看到状态、理解进度、一键行动。

**差异化锚点**：工作流编排是 Maestro IDE 的独特价值。AI 对话体验已被市场商品化（Cline、Continue.dev、Cursor 均提供），但结构化的多步骤工作流编排与可视化进度追踪是 maestro 生态独有的能力，也是竞品未覆盖的空白。

## 2. Target Users

### Persona A: The Reluctant CLI User (不情愿的 CLI 用户)

- **背景**：maestro-flow 现有用户，理解工作流概念（chain、milestone、phase），但觉得 60+ 命令繁琐难记
- **痛点**：命令记忆负担重、输入繁琐、缺少可视化状态追踪、无法快速定位当前进度
- **期望**：一键触发完整工作流、键盘快捷键、快速访问特定命令、高级模式下可见原始概念
- **使用方式**：日常使用终端，将 GUI 视为加速器而非替代
- **成功标准**：GUI 触发工作流的比例超过 60%，且操作速度不低于 CLI 直接执行

### Persona B: The AI-Curious Developer (AI 好奇型开发者)

- **背景**：Claude Code 新用户，想用 AI 辅助开发但不会用 CLI，缺乏 maestro 心智模型
- **痛点**：CLI 门槛高、不知道该执行什么命令、技术术语难以理解、缺少引导
- **期望**：自然语言描述需求、系统自动推荐下一步、简单模式下无技术术语、可视化状态展示
- **使用方式**：将 GUI 视为主要界面，极少直接使用终端
- **成功标准**：从打开应用到触发第一个工作流的时间 < 2 分钟

**双用户策略**：产品 MUST 优先服务 Persona A（现有用户有明确痛点，是核心 beachhead），同时通过 Concept Translator (F-006) 的分层展示模式兼顾 Persona B。两个用户群共享同一界面，通过 simple default + advanced unlock 模式统一体验。

## 3. Problem Statement

不习惯 CLI 的开发者在使用 maestro-flow 时面临四重痛点：

1. **命令记忆负担**：maestro-flow 拥有 60+ 命令，用户需要记忆命令名称、参数格式和组合方式。即使理解工作流概念的用户，也常常需要查阅 `--help` 才能正确执行。

2. **输入繁琐**：完整工作流链路（分析 -> 规划 -> 执行 -> 测试）需要依次执行多个命令，每个命令都有参数配置。手动输入容易出错且效率低下。

3. **缺少可视化状态追踪**：CLI 输出是线性的文本流，用户难以快速了解项目整体进度、当前所处阶段和推荐下一步操作。里程碑/阶段/步骤的层级关系在终端中难以直观呈现。

4. **缺少统一 AI 开发入口**：Claude Code 是强大的 AI 编程助手，但只能通过 CLI 交互。新用户面对 CLI 门槛望而却步，无法体验 AI 辅助开发的价值。

这些痛点的根源是：maestro 的能力被 CLI 界面所限制，而非能力本身不足。Maestro IDE 的使命是打破这层界面限制，让 maestro 的完整工作流能力对非 CLI 用户同样可达。

## 4. Product Goals

| # | Goal | Metric | Target | Rationale |
|---|------|--------|--------|-----------|
| G-1 | GUI 成为 maestro 工作流的首选触发方式 | GUI 触发率（GUI vs CLI） | > 60% 在 3 个月内 | 验证 GUI 提供了超越 CLI 的真实价值 |
| G-2 | 新用户快速到达价值时刻 | Time-to-first-workflow | < 2 分钟从打开应用到触发首个工作流 | 新用户留存取决于首次体验 |
| G-3 | GUI 状态与实际状态高度一致 | State sync accuracy | > 99% 在 5 秒内 | 信任建立在 GUI 反映现实的基础上 |
| G-4 | 简单模式零术语泄漏 | Concept translation coverage | 100% 用户可见字符串已翻译 | 术语泄漏会破坏新用户的简单模式体验 |
| G-5 | 破坏性操作必须经过人工审核 | Approval gate usage | > 80% 破坏性操作经过审批 | 安全网被使用而非被绕过 |

## 5. Scope & Non-Goals

### In Scope (MVP)

7 个功能按优先级分层：

**Foundation (MUST 先交付)**：
- F-005 State Sync Engine -- WebSocket 实时推送 CLI 状态变更，事件驱动架构
- F-006 Concept Translator -- 技术概念映射为用户语言，分层展示模式

**Core MVP**：
- F-001 Workflow Commander -- 工作流编排面板：一键触发完整链路，可视化选择工作流类型
- F-002 Project Radar -- 项目状态仪表盘：实时展示里程碑/阶段/步骤进度，推荐下一步

**Interaction Surfaces**：
- F-003 AI Dialog -- AI 对话面板：与 Claude Code 自然语言交互，流式输出，意图识别路由
- F-004 Terminal Bridge -- 终端桥接：xterm.js 嵌入终端，实时 CLI 输出，进程生命周期管理

**Trust Layer**：
- F-007 Approval Gate -- 审批门控：工作流关键节点的确认/拒绝，diff 预览，dry-run 展示

### Non-Goals (Out of Scope)

| Non-Goal | Rationale |
|----------|-----------|
| 多模型后端支持 | 仅对接 Claude Code，不接入 OpenAI/Gemini 等 |
| 团队协作功能 | 不支持多人实时协作开发 |
| 完整代码编辑器 | 不内置编辑器，用户使用自己的编辑器 |
| VS Code / JetBrains 集成 | Phase 2 考虑，MVP 不涉及 |
| 插件市场/扩展系统 | MVP 不提供扩展机制 |
| 桌面打包 (Electron/Tauri) | MVP 以本地 Web 应用形式交付，打包为后续优化 |

### Architectural Constraints

| ID | Constraint | RFC 2119 |
|----|-----------|----------|
| C-003 | 产品 MUST 采用本地 Web 应用架构（HTTP/WS 服务 + 浏览器前端） | MUST |
| C-004 | Claude Code 集成 MUST 采用渐进式策略：先 CLI 子进程，后续扩展 API 直连 | MUST |
| C-005 | 状态同步 MUST 采用事件驱动 + WebSocket 架构 | MUST |
| C-006 | 后端 MUST 使用 Node.js，前端 MUST 使用 SvelteKit | MUST |
| C-007 | CLI 输出解析 MUST 抽象为适配器层 | MUST |

### UX Constraints

| ID | Constraint | RFC 2119 |
|----|-----------|----------|
| C-008 | 产品 MUST 隐藏 maestro 技术概念，采用意图驱动的交互模式 | MUST |
| C-009 | 首要交互模式 MUST 为状态导向（展示当前状态 + 推荐下一步） | MUST |
| C-010 | 用户 MUST 能通过自然语言描述需求，系统自动路由到对应工作流 | MUST |

## 6. Key Differentiators

### D-1: 结构化工作流编排

竞品（Cline、Continue.dev、Cursor）聚焦于 AI 对话和代码生成，Maestro IDE 聚焦于**结构化多步骤工作流**的编排与可视化。从分析 -> 规划 -> 执行 -> 测试的完整链路编排，配合实时步骤进度追踪，是 maestro 生态独有的能力，也是竞品未覆盖的空白。

### D-2: 意图驱动 + 状态导向交互

传统 CLI wrapper 将命令映射为菜单项（GUI shallowness pitfall），Maestro IDE 采用意图驱动交互：用户描述目标，系统自动路由到对应工作流。状态导向展示让用户始终知道"现在在哪、下一步做什么"，消除选择正确命令的认知负担。

### D-3: 概念翻译层

面向非 CLI 用户的核心壁垒是 maestro 的技术术语体系。Concept Translator (F-006) 在所有用户可见文本上应用双向映射，简单模式下零术语泄漏。这是竞品未尝试的深度抽象，也是服务 Persona B 的关键能力。

### D-4: 终端辅助定位

Maestro IDE 明确定位为终端的视觉化控制台，而非终端替代或 IDE 替代。这意味着产品不构建编辑器、不替代终端、不与用户现有工具链竞争，而是作为编排层叠加在现有工作流之上。

## 7. Success Metrics

### Primary Metrics (MUST 达标)

| Metric | Target | Measurement |
|--------|--------|-------------|
| GUI workflow trigger rate | > 60% 在 3 个月内 | GUI 触发次数 / (GUI + CLI) 总触发次数 |
| Time-to-first-workflow | < 2 分钟 | 从打开应用到成功触发首个工作流的时长 |
| State sync accuracy | > 99% 在 5 秒内 | GUI 显示状态与 CLI 实际状态的一致率 |
| Concept translation coverage | 100% 用户可见字符串 | 自动化回归测试扫描 simple mode UI |
| Approval gate usage | > 80% 破坏性操作经过审批 | 审批触发次数 / 破坏性操作总次数 |

### Secondary Metrics (SHOULD 追踪)

| Metric | Target | Measurement |
|--------|--------|-------------|
| State sync latency | < 500ms | 状态变更到 UI 更新的端到端延迟 |
| AI Dialog first token latency | < 200ms | 用户发送消息到看到 typing indicator 的延迟 |
| Terminal output render latency | < 100ms | CLI 输出数据到 xterm.js 渲染的延迟 |
| Mode switch completion | < 200ms | simple/advanced 模式切换的视觉完成时间 |
| WebSocket reconnection rate | > 99% | 断连后自动重连成功的比例 |

### Anti-Metrics (MUST NOT 发生)

| Anti-Metric | Threshold | Rationale |
|-------------|-----------|-----------|
| Simple mode terminology leak | 0 处 | 任何原始术语泄漏都会破坏新用户信任 |
| Auto-approve destructive actions | 0 次 | 破坏性操作未经审批自动执行是不可接受的 |
| GUI blocks CLI-native workflows | 0 次 | GUI 绝不能阻止用户在终端直接使用 maestro |

## 8. Risk Assessment

### R-1: CLI 输出解析脆弱性 (HIGH)

**描述**：Claude Code CLI 输出格式可能随版本变化，导致解析适配器失效。这是所有 CLI wrapper 产品的固有风险。

**影响**：State Sync Engine (F-005) 和 Terminal Bridge (F-004) 依赖 CLI 输出解析。解析失效会导致状态同步中断、终端输出无法标注。

**缓解**：
- CLI 输出解析 MUST 抽象为适配器层 (C-007)，隔离版本变更影响
- SHOULD 支持 `maestro ralph skills --json --quiet` 格式获取结构化数据 (SA-07)
- MUST 建立回归测试，覆盖 CLI 输出解析的关键路径
- SHOULD 版本锁定 CLI，在升级前验证适配器兼容性

### R-2: 状态同步延迟与不一致 (HIGH)

**描述**：WebSocket 推送与文件系统状态的时序一致性难以保证。用户同时在终端和 GUI 操作可能导致状态冲突。

**影响**：State Sync Engine (F-005) 的核心价值是实时准确的状态同步。延迟或不一致会直接破坏用户信任。

**缓解**：
- 状态同步 MUST 采用事件驱动 + WebSocket 架构 (C-005)，避免文件轮询
- 状态变更 MUST 在 500ms 内推送到 UI
- MUST 实现双源状态模型，将 PM 的 99% 准确率与 UX 的 500ms 延迟作为统一验收标准
- SHOULD 实现重连缓冲和回放协议，处理 WebSocket 断连场景

### R-3: 概念抽象泄漏 (HIGH)

**描述**：深度隐藏 maestro 概念后，错误信息、CLI 输出片段、异常路径可能暴露原始术语，破坏简单模式体验。

**影响**：Concept Translator (F-006) 的核心承诺是简单模式零术语泄漏。任何泄漏都会破坏 Persona B 的使用体验。

**缓解**：
- 所有用户可见文本 MUST 通过 translate() 函数渲染
- 不可翻译的错误 MUST 包装在通用容器中，通过 Show details 渐进披露
- MUST 建立自动化回归测试，扫描 simple mode UI 中的未翻译术语
- 四角色统一防御：SA middleware + UI ConceptTranslator + UX rendering rules + 共享回归测试

### R-4: MVP 范围蔓延 (MEDIUM)

**描述**：7 个功能形成紧密依赖图，F-005 和 F-006 是几乎所有其他功能的前置依赖。如果基础功能延迟，整个 MVP 被阻塞。同时，"完整 AI 开发平台"的愿景容易导致过度构建。

**影响**：交付延迟、功能膨胀、核心价值被稀释。

**缓解**：
- MUST 执行分阶段交付：Foundation -> Core MVP -> Interaction -> Trust
- MUST NOT 在 MVP 阶段添加 7 个功能之外的新功能
- 每个阶段 MUST 产出可用的增量，避免"全部完成才算完成"

### R-5: 双用户群设计张力 (MEDIUM)

**描述**：Persona A 需要速度和原始概念可见，Persona B 需要简化和术语翻译。两个用户群的需求方向相反。

**影响**：如果处理不当，产品要么对 CLI 用户过于简化（失去效率），要么对新用户过于技术化（失去可达性）。

**缓解**：
- MUST 采用分层展示模式 (UX-04)：simple default + advanced unlock
- 模式切换 MUST 使用渐进披露（添加元素，而非替换布局）
- 模式状态 MUST 全局一致，不允许面板独立切换模式

### R-6: Windows ConPTY 稳定性 (LOW-MEDIUM)

**描述**：node-pty 在 Windows ConPTY 上存在已知兼容性问题（SIGINT 处理、resize 错误恢复），可能影响 Terminal Bridge (F-004) 的稳定性。

**影响**：Windows 用户的终端交互体验可能受损。

**缓解**：
- Terminal Bridge 设计 MUST 纳入 Windows 特定约束
- SHOULD 实现 resize 错误恢复机制
- SHOULD 在 Windows 上使用 SIGINT 替代方案实现 Stop 功能

### Open Questions

| # | Area | Question | Options |
|---|------|----------|---------|
| OQ-1 | Intent classification | 意图分类策略：LLM-based（更准确但延迟高）vs rule-based（更快但可能不满足 70% 阈值）vs hybrid | LLM-based / rule-based + disambiguation fallback / hybrid |
| OQ-2 | Terminal interactivity | Terminal Bridge 交互范围：完全交互式 PTY vs 只读日志视图 vs 模式依赖 | fully-interactive PTY / read-only log view / mode-dependent |
| OQ-3 | Approval granularity | 审批粒度模型：按步骤 vs 按工作流 vs 可配置 | per-step / per-workflow / configurable |
