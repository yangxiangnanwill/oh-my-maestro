# REQ-006: Concept Translator

| Field | Value |
|-------|-------|
| **ID** | REQ-006 |
| **Feature** | Concept Translator |
| **Trace** | F-006 |
| **Priority** | Should |
| **Decisions** | PM-02, PM-06, UX-01, UX-03, UX-04 |

## Description

Concept Translator 是使 maestro 对非 CLI 用户可访问的翻译层。按照 UX-01 和 UX-03 的要求，产品 MUST 隐藏 maestro 技术概念并展示用户友好语言。该功能实现了 guidance specification 术语表（Section 2）中定义的映射。

从产品角度，Concept Translator 对服务 Claude Code 新用户群体（PM-02）至关重要。这些用户不知道 "chain"、"skill" 或 "delegate" 是什么 -- 他们用 "工作流"、"操作" 和自动化步骤来思考。翻译层弥合这一鸿沟。

该功能还支持分层展示模型（UX-04）：简单模式隐藏技术细节，高级模式揭示它们。这对同时服务两个用户群体而不疏远任何一方至关重要。

> **Cross-Role Gap (G-003)**: 客户端 translate/shouldHide MUST 与 SA 服务端 Translator middleware envelope 对齐 -- 服务端预翻译标签，客户端控制可见性。

## User Story

**As a** 不熟悉 maestro 技术概念的开发者，**I want** 在 GUI 中看到用户友好的术语而非 maestro 的技术术语（如看到 "Workflow" 而非 "chain"），**So that** 我能理解界面含义而不需要学习 maestro 的专有概念体系。

## Acceptance Criteria

1. **AC-006-01**: Concept Translator MUST 将所有 maestro 技术术语映射为用户友好等价词，如 guidance specification 术语表所定义（UX-03）。映射 MUST 覆盖 guidance Section 2 中的每个 maestro 概念。隐藏概念在简单模式下 MUST NOT 在任何情况下渲染，包括错误消息。

2. **AC-006-02**: 来自 maestro CLI 的错误消息 MUST 在展示前经过翻译 -- 原始技术术语在简单模式下 MUST NOT 泄漏给用户（UX-01）。不可翻译的错误 MUST 包装在通用容器中并提供 "Show details" 披露控件。

3. **AC-006-03**: 系统 SHOULD 支持简单模式和高级模式之间的切换（UX-04）。模式切换 MUST 使用渐进式披露（添加元素，而非替换）；模式 MUST NOT 在各面板间独立切换；过渡 SHOULD 在 200ms 内完成。高级模式下，技术术语 MAY 与用户友好标签并排展示。

4. **AC-006-04**: 翻译层 MUST 在所有 UI 表面一致应用 -- Project Radar、Workflow Commander、AI Dialog 和 Terminal Bridge。Terminal Bridge 简单模式下 MUST NOT 默认展示原始 CLI 输出。

5. **AC-006-05**: 当出现翻译映射表中未覆盖的新 maestro 概念时，系统 MUST 优雅降级 -- 展示原始术语并附加 "technical" 标记。翻译映射 MUST 可扩展以支持 maestro CLI 更新后的新术语。

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Translation Map | Consumes | 静态映射表: `{ technical, userFacing, description }` |
| Display Mode | Consumes | 用户偏好 -- "simple" 或 "advanced" |
| Translated Output | Emits | 所有用户可见字符串基于展示模式经过翻译层过滤 |
| `translate(term, mode)` | Function | 返回翻译后的字符串 |
| `shouldHide(term, mode)` | Function | 返回布尔值控制可见性 |
| `describeWorkflow(chainId, mode)` | Function | 返回 `{ title, description, steps[] }` |

## Dependencies

- **F-001** (Workflow Commander): 工作流标签翻译
- **F-002** (Project Radar): 状态术语翻译
- **F-003** (AI Dialog): 对话内容翻译
- **F-004** (Terminal Bridge): CLI 输出翻译
- **F-007** (Approval Gate): 审批描述翻译
