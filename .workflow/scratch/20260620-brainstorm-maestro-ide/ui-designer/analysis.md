# UI Designer Analysis — Maestro IDE

> Contract: guidance-specification.md section 7 (decisions UI-01 through UI-07)
> Owns: Layout structure, component behavior specifications, interaction patterns, state design, panel composition, visual choreography of workflow progress, terminal integration UX, approval gate interaction model
> Does not own: Visual styling (colors, typography, spacing — handled by design tokens/theme), backend architecture, CLI output parsing, WebSocket protocol design, concept translation logic

## 1. Role Mandate

The UI Designer defines the interaction structure, component behavior, and information architecture for Maestro IDE. This role owns the dual-panel layout (UI-01), the three-panel tab switching model (UI-04), and the component specifications for all seven features. It decides how users navigate between workflow execution, AI conversation, and terminal views; how state changes propagate visually; and how approval gates interrupt workflow flow. It defers visual styling (color values, font sizes, spacing) to a design token system, backend protocol details to the System Architect, and concept translation logic to the UX Expert. The design-research patterns (Agent-Sidebar, Approval Gate, Status Tree, Local-Server-Plus-Browser) inform the interaction models adopted here.

## 2. Decision Digest

### Decisions
| ID | Feature | Stance | Constraints (RFC 2119) |
|----|---------|--------|------------------------|
| UI-01 | cross-cutting | Dual-panel layout: left nav + right content | MUST use dual-panel; left nav MUST contain status tree and workflow shortcuts |
| UI-02 | cross-cutting | Dark theme as default | MUST default to dark theme; all components MUST meet WCAG AA contrast in dark mode |
| UI-03 | F-002 | Left nav contains project status tree + workflow quick-access | Status tree MUST show hierarchical project state; workflow shortcuts MUST navigate to F-001 |
| UI-04 | cross-cutting | Right content area supports three tab-switchable panels | MUST support Workflow/Dialog/Terminal tabs; panel state MUST persist across switches |
| UI-05 | F-003 | AI dialog supports streaming Markdown output | MUST render Markdown with syntax highlighting; MUST stream token-by-token |
| UI-06 | F-001 | Workflow execution shows step progress bar | MUST display real-time step status; MUST update via WebSocket events |
| UI-07 | F-007 | Approval gate shows diff preview and dry-run | MUST show diff before file modifications; SHOULD show dry-run summary when available |
| UI-08 | F-004 | Terminal uses xterm.js with multi-session tabs | MUST use xterm.js; MUST support concurrent PTY sessions |
| UI-09 | F-005 | Client-side state via Svelte stores subscribed to WebSocket | MUST use reactive stores; MUST NOT use REST polling as primary state source |
| UI-10 | F-006 | Concept translator resolves all user-facing labels | MUST pass all labels through translator; raw maestro terms MUST NOT appear in simple mode |

### Interfaces
| Name | Contract | Consumers |
|------|----------|-----------|
| WorkflowTrigger | { workflowId: string, params: Record<string, string> } | F-001, F-003 (AI Dialog routing), LeftNav shortcuts |
| SyncEvent | { type: enum, payload: unknown } | F-001, F-002, F-003, F-005 (all state-dependent panels) |
| ConceptTranslator | { resolve(term: string, context?: string): TranslatedTerm } | All UI components |
| ApprovalModal | { step, diff, dryRun, onApprove, onReject } | F-001 (workflow execution), F-007 |
| TerminalView | { sessionId: string, wsUrl: string } | F-004, F-001 (auto-switch on workflow spawn) |

### Cross-Cutting Positions
| Topic | Stance |
|-------|--------|
| Layout | Dual-panel with persistent left nav and tab-switchable right content; no three-column layout |
| State propagation | All panels receive WebSocket events via Svelte stores regardless of active tab |
| Concept hiding | Every user-facing string passes through ConceptTranslator; no raw maestro terms in simple mode |
| Dark theme | Default and only theme for MVP; all components designed for dark backgrounds first |
| Accessibility | WCAG AA contrast minimum; keyboard navigation for all interactive elements; ARIA live regions for streaming updates |
| Panel continuity | Tab switching preserves component state; no destruction/recreation on switch |

### Findings Summary
| Slug | Title | Impact |
|------|-------|--------|
| dark-theme-contrast | Dark Theme Contrast and Accessibility Requirements | HIGH — all status colors, diff colors, and syntax highlighting must meet WCAG AA on dark backgrounds |
| panel-switching-continuity | Panel Switching and State Continuity | MEDIUM — panels must remain stateful across tab switches; cross-panel navigation needed |

## 3. Cross-Cutting Foundations

### Design Tokens

A design token system MUST be established before component implementation. Tokens MUST cover: status colors (PENDING, RUNNING, DONE, FAILED), gauge states (on-track, at-risk, blocked), diff colors (addition, removal), and terminal ANSI color mapping. All tokens MUST be verified against WCAG AA contrast ratios for the dark theme background. The token system SHOULD be implemented as CSS custom properties or a Svelte-compatible theme store.

### Component States

Every interactive component MUST define a complete state matrix: default, hover, active, disabled, loading, and error. The StepProgressBar in F-001 requires four domain-specific states (PENDING, RUNNING, DONE, FAILED). The ApprovalModal in F-007 requires a waiting-for-approval state in the parent workflow. Components MUST NOT enter undefined visual states; every possible data condition MUST map to a defined state.

