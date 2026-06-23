# REQ-003: AI Dialog

| Field | Value |
|-------|-------|
| **ID** | REQ-003 |
| **Feature** | AI Dialog |
| **Trace** | F-003 |
| **Priority** | Must |
| **Decisions** | PM-02, PM-04, UX-05, UI-05 |

## Description

AI Dialog 是面向不习惯 CLI 用户的自然语言入口。按照 UX-05 的要求，用户 MUST 能用自然语言描述需求，系统自动路由到对应工作流。

> **Cross-Role Resolution (C-003)**: 意图分类策略 MUST 支持至少 70% 置信度目标；基于规则的 MVP 需要 disambiguation fallback 机制。

该功能服务两个用户群体：
- **Claude Code 新用户**: AI Dialog 是他们的主要交互面 -- 描述需求，系统处理其余工作。
- **maestro 现有用户**: AI Dialog 是加速器 -- 仍可直接使用 Workflow Commander，但自然语言为已知意图提供更快路径。

对话 MUST 支持流式输出（UI-05），因为 Claude Code 响应包含代码和格式化内容。意图识别将用户输入路由到工作流触发（F-001）或直接 Claude Code 对话，取决于检测到的意图类型。

## User Story

**As a** 不熟悉 maestro 命令体系的开发者，**I want** 用自然语言描述我的开发需求（如 "我想添加一个登录功能"），系统自动识别意图并路由到对应工作流，**So that** 我不需要知道正确的命令名称和参数，只需表达意图即可完成操作。

## Acceptance Criteria

1. **AC-003-01**: AI Dialog MUST 支持自然语言输入，并自动将意图路由到对应工作流（UX-05）。当意图置信度超过 70% 时，MUST 展示 inline action card 供用户确认；MUST NOT 在未经用户明确确认的情况下自动执行工作流。

2. **AC-003-02**: 对话 MUST 支持流式输出渲染，包括 Markdown 格式和代码块（UI-05）。AI typing indicator MUST 在首个 token 到达后 200ms 内显示。

3. **AC-003-03**: 系统 SHOULD 区分 "工作流意图"（路由到 F-001）和 "对话意图"（直接 AI 响应）。当意图不明确时，MUST 提供澄清选项而非猜测。

4. **AC-003-04**: AI Dialog MUST NOT 成为触发工作流的唯一方式 -- Workflow Commander MUST 始终作为直接接口可访问（PM-04）。对话上下文 MUST 跨会话持久化以保持连续性。

5. **AC-003-05**: 当对话触发工作流执行时，MUST 提供从对话视图到工作流执行视图的平滑视觉过渡。面板切换（对话/工作流/终端）MUST 保留各面板的滚动位置和输入状态。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Chat Input | Emits | 用户自然语言消息；系统检测意图并路由 |
| Streaming Response | Consumes | 来自 Claude Code 子进程的 SSE/WebSocket 流；包含 markdown、代码块 |
| Intent Route | Emits | 分类后的意图 -> 工作流触发（F-001）或直接 AI 响应 |
| Conversation History | Consumes | `GET /api/conversations/{id}` -- 历史消息用于上下文连续性 |
| Intent Classification | Consumes | `POST /api/intents/classify` -- 意图分类端点（G-001 gap resolution） |

## Dependencies

- **F-001** (Workflow Commander): 工作流意图的执行目标
- **F-005** (State Sync Engine): 状态事件订阅
- **F-006** (Concept Translator): 术语翻译
- **F-004** (Terminal Bridge): AI 输出可能通过终端重定向
