# Maestro IDE -- Product Requirements Document Index

> Blueprint: BLP-maestro-ide-2026-06-20
> Generated: 2026-06-20
> Source: BRN-20260620-maestro-ide brainstorm artifacts

## Requirements Summary

| ID | Title | Priority | Trace | AC Count | Document |
|----|-------|----------|-------|----------|----------|
| REQ-001 | Workflow Commander | Must | F-001 | 5 | [REQ-001-workflow-commander.md](./REQ-001-workflow-commander.md) |
| REQ-002 | Project Radar | Must | F-002 | 5 | [REQ-002-project-radar.md](./REQ-002-project-radar.md) |
| REQ-003 | AI Dialog | Must | F-003 | 5 | [REQ-003-ai-dialog.md](./REQ-003-ai-dialog.md) |
| REQ-004 | Terminal Bridge | Must | F-004 | 5 | [REQ-004-terminal-bridge.md](./REQ-004-terminal-bridge.md) |
| REQ-005 | State Sync Engine | Must | F-005 | 5 | [REQ-005-state-sync-engine.md](./REQ-005-state-sync-engine.md) |
| REQ-006 | Concept Translator | Should | F-006 | 5 | [REQ-006-concept-translator.md](./REQ-006-concept-translator.md) |
| REQ-007 | Approval Gate | Should | F-007 | 5 | [REQ-007-approval-gate.md](./REQ-007-approval-gate.md) |

## Non-Functional Requirements Summary

| ID | Title | Category | Priority | Document |
|----|-------|----------|----------|----------|
| NFR-PERF-001 | Latency Performance | Performance | Must | [NFR-perf-001-latency.md](./NFR-perf-001-latency.md) |
| NFR-SEC-001 | Local-Only Security | Security | Must | [NFR-sec-001-local-only.md](./NFR-sec-001-local-only.md) |
| NFR-UX-001 | Accessibility and Usability | Usability | Must | [NFR-ux-001-accessibility.md](./NFR-ux-001-accessibility.md) |

## MoSCoW Priority Distribution

| Priority | Count | Requirements |
|----------|-------|-------------|
| **Must** | 5 | REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 |
| **Should** | 2 | REQ-006, REQ-007 |
| **Could** | 0 | -- |
| **Won't** | 0 | -- |

## Traceability Matrix: REQ -> F-xxx

| REQ | Feature (F-xxx) | Guidance Decisions | Cross-Role Resolutions |
|-----|------------------|--------------------|-----------------------|
| REQ-001 | F-001 Workflow Commander | PM-03, PM-04, PM-06, UX-01, UX-05 | -- |
| REQ-002 | F-002 Project Radar | PM-03, PM-02, UX-02, UX-06 | -- |
| REQ-003 | F-003 AI Dialog | PM-02, PM-04, UX-05, UI-05 | C-003 (70% confidence threshold) |
| REQ-004 | F-004 Terminal Bridge | PM-01, PM-05, SA-04, SA-05 | C-002 (SA-06 scoped to simple mode) |
| REQ-005 | F-005 State Sync Engine | PM-03, SA-03 | S-002 (dual-source state model) |
| REQ-006 | F-006 Concept Translator | PM-02, PM-06, UX-01, UX-03, UX-04 | G-003 (translate/shouldHide contract), S-001 (concept leak defense) |
| REQ-007 | F-007 Approval Gate | PM-01, PM-04, UI-07 | C-001 (inline panel, not modal), G-002 (gate:resolved event) |

## Traceability Matrix: NFR -> REQ Coverage

| NFR | REQ-001 | REQ-002 | REQ-003 | REQ-004 | REQ-005 | REQ-006 | REQ-007 |
|-----|---------|---------|---------|---------|---------|---------|---------|
| NFR-PERF-001 (Latency) | | | AC-003-02 | AC-004-01 | AC-005-01, AC-005-02 | | |
| NFR-SEC-001 (Local-Only) | | | | AC-004-03, AC-004-04 | AC-005-05 | | |
| NFR-UX-001 (Accessibility) | AC-001-02 | AC-002-01 | | AC-004-02 | | AC-006-03, AC-006-04 | AC-007-02, AC-007-05 |

## Traceability Matrix: Constraint -> REQ

| Constraint | REQ Coverage |
|-----------|-------------|
| C-001 产品 MUST 定位为终端辅助工具 | REQ-004 (AC-004-02) |
| C-002 MVP 核心价值 MUST 为工作流编排 + 状态可视化 | REQ-001, REQ-002, REQ-005 |
| C-003 产品 MUST 采用本地 Web 应用架构 | NFR-SEC-001 |
| C-004 Claude Code 集成 MUST 采用渐进式策略 | REQ-003, REQ-004 |
| C-005 状态同步 MUST 采用事件驱动 + WebSocket | REQ-005 |
| C-006 后端 Node.js + 前端 SvelteKit | REQ-004, REQ-005 |
| C-007 CLI 输出解析 MUST 抽象为适配器层 | REQ-004, REQ-006 |
| C-008 MUST 隐藏 maestro 技术概念 | REQ-006 |
| C-009 首要交互模式 MUST 为状态导向 | REQ-002 |
| C-010 MUST 支持自然语言路由到工作流 | REQ-003, REQ-001 |

## Dependency Graph

```
REQ-005 (State Sync Engine) ----+---- REQ-001 (Workflow Commander)
                                +---- REQ-002 (Project Radar)
                                +---- REQ-003 (AI Dialog)
                                +---- REQ-004 (Terminal Bridge)

REQ-006 (Concept Translator) ---+---- REQ-001 (Workflow Commander)
                                +---- REQ-002 (Project Radar)
                                +---- REQ-003 (AI Dialog)
                                +---- REQ-004 (Terminal Bridge)
                                +---- REQ-007 (Approval Gate)

REQ-001 (Workflow Commander) ---+---- REQ-007 (Approval Gate)
REQ-003 (AI Dialog) ------------+---- REQ-001 (Workflow Commander)
REQ-002 (Project Radar) --------+---- REQ-001 (Workflow Commander)
```

**Implementation Order Recommendation**: REQ-005 -> REQ-006 -> REQ-004 -> REQ-001 -> REQ-002 -> REQ-003 -> REQ-007
