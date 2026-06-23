# UX Expert Analysis - Maestro IDE

> Contract: guidance-specification.md S6 (decisions UX-01 through UX-06)
> Owns: Interaction patterns, concept translation, mode switching, intent routing, status-oriented display, visual progress, approval flow UX, accessibility
> Does not own: Visual branding, component styling, layout grid, color palette, typography (UI Designer); backend architecture, WebSocket protocol, CLI parsing (System Architect); product positioning, prioritization (Product Manager)

## 1. Role Mandate (<= 200 words)

The UX Expert defines how non-CLI developers interact with maestro 60+ command ecosystem through the Maestro IDE. This role owns the interaction model: intent-driven entry (UX-01), status-oriented primary mode (UX-02), concept translation layer (UX-03), layered display modes (UX-04), natural language routing (UX-05), and visual progress indicators (UX-06). The core mandate is eliminating the cognitive burden of maestro terminology while preserving full power-user access via progressive disclosure. This role decides how workflows are discovered and triggered, how project state is communicated, how approval gates are presented, and how mode switching behaves across all panels. It defers visual styling (tokens, colors, typography) to the UI Designer, backend event protocol to the System Architect, and product scope to the Product Manager. The UX Expert ensures every user-facing surface translates technical concepts into user-friendly language and that the interface always shows what is happening and what to do next.

## 2. Decision Digest

### Decisions

| ID | Feature | Stance | Constraints (RFC 2119) |
|----|---------|--------|------------------------|
| UX-01 | F-001, F-003, F-006, F-007 | Hide maestro technical concepts behind intent-driven interaction; raw command names MUST NOT appear in simple mode | MUST hide chain/skill/delegate/session terminology in simple mode; intent recognition below 70% confidence MUST trigger clarification |
| UX-02 | F-002, F-005, F-007 | Status-oriented primary interaction: display current state plus recommended next action at all times | MUST show Recommended Next Step card whenever a project is active; MUST NOT show empty/static state without guidance |
| UX-03 | F-006 | Bidirectional terminology mapping from maestro concepts to user-facing labels | MUST cover every maestro concept in guidance section 2; hidden concepts MUST NOT render in simple mode under any circumstance including error messages |
| UX-04 | F-001, F-003, F-004, F-006 | Layered display mode: simple mode hides details, advanced mode exposes raw concepts via progressive disclosure | Mode switching MUST use progressive disclosure (add elements, not replace); mode MUST NOT be toggled independently per panel; transition SHOULD complete within 200ms |
| UX-05 | F-001, F-003 | Natural language input routes to workflows via intent detection with inline action card confirmation | MUST surface inline action card for intents above 70% confidence; MUST NOT auto-execute workflows without explicit user confirmation |
| UX-06 | F-002 | Visual progress indicators replace text-based status lists | MUST use color, shape, and icon to convey status (not color alone); progress MUST be percentage-based from step status |

### Interfaces

> **Cross-Role Gap (G-001)**: IntentRouter consumer F-005 has no matching SA interface definition — SA needs to add intent classification endpoint
> **Cross-Role Gap (G-002)**: ApprovalResponse consumer F-005 has no matching SA WebSocket event — SA needs gate:resolved event for state propagation
> **Cross-Role Gap (G-003)**: Client-side translate/shouldHide must align with SA server-side Translator middleware envelope — server pre-translates labels, client controls visibility

| Name | Contract | Consumers |
|------|----------|-----------|
| IntentRouter | (nl: string) => { workflowId, confidence, params } | F-005 State Sync Engine (workflow initiation) |
| WorkflowProgress | { stepIndex, stepName, status } event stream | F-002 Project Radar (cross-panel status) |
| ApprovalRequest | { gateId, stepName, summary, diffPreview, dryRunResult, riskLevel } | F-007 Approval Gate (inline approval UI) |
| ApprovalResponse | { gateId, decision, modifiedParams? } | F-005 State Sync Engine (resume/cancel workflow) |
| ProjectStatus | { milestones[], recommendedNext } | Left navigation panel (compact status) |
| StateSubscription | WebSocket channel project:{id}:state (incremental diffs) | F-002 Project Radar (real-time updates) |
| StateChangeEvent | { type, action, payload, timestamp } | F-001, F-002, F-003, F-004 (all consumer panels) |
| ConnectionState | { status, lastEventTimestamp } | All panels (disconnection handling) |
| translate | (term, mode) => string | All UI surfaces (concept translation) |
| shouldHide | (term, mode) => boolean | All UI surfaces (visibility control) |
| describeWorkflow | (chainId, mode) => { title, description, steps[] } | F-001 Workflow Commander (workflow display) |
| DialogInput | { message, context: { projectId, activeWorkflowId } } | F-003 AI Dialog (conversation entry) |
| IntentDetected | { intent, confidence, suggestedAction } | F-001 Workflow Commander (action confirmation) |
| TerminalStream | WebSocket channel terminal:{sessionId} (bidirectional) | F-004 Terminal Bridge (PTY I/O) |
| AnnotatedOutput | { line, annotation: { type, label, icon } } | F-004 Terminal Bridge (output overlay) |

### Cross-Cutting Positions

| Topic | Stance |
|-------|--------|
| Concept abstraction leak | Defensive rendering layer MUST wrap all user-facing text in translate(); catch-all error container for untranslatable terms; Terminal Bridge simple mode MUST NOT show raw CLI output by default |
| Dual-mode consistency | Global mode state consumed by all panels; progressive disclosure adds elements rather than replacing; mode toggle persistent in user preferences and accessible from global navigation |
| Real-time feedback quality | Stateful events MUST arrive within 500ms; terminal output MUST render within 100ms; AI Dialog MUST show typing indicator within 200ms of first token |
| Accessibility | Visual indicators MUST use color + shape + icon (not color alone); diff preview MUST be screen-reader navigable; keyboard navigation MUST cover all decision controls |
| Error handling | Raw maestro errors MUST pass through translator before display; untranslatable errors wrapped in generic container with Show details disclosure; rejection in Approval Gate MUST require reason field |

### Findings Summary

| Slug | Title | Impact |
|------|-------|--------|
| concept-abstraction-leak | Concept Abstraction Leak Risk | HIGH - untranslated terms in errors/CLI output will break the simple-mode experience for all features |
| dual-mode-consistency | Dual-Mode Interaction Consistency | MEDIUM - inconsistent mode switching across panels will erode user trust in the interface |

## 3. Cross-Cutting Foundations

### Information Architecture

The Maestro IDE information architecture follows a status-oriented hierarchy: project > milestones > stages > steps. This hierarchy MUST be reflected consistently across the left navigation tree (UI-03), the Project Radar dashboard (F-002), and the Workflow Commander progress view (F-001). The Concept Translator (F-006) governs all labels at every level. Navigation MUST allow direct access to any level of the hierarchy without requiring linear traversal. The three right-panel views (dialog, workflow, terminal per UI-04) represent interaction modes, not information silos - context from one view MUST be available when switching to another.

### Sigil/Input

Intent entry is the primary input mechanism. Users express goals in natural language (UX-05) or select from categorized quick-select tiles. The system MUST NOT require users to recall command names or syntax. Slash commands are reserved as power-user shortcuts in advanced mode only. Input validation MUST provide immediate, translated feedback when an intent cannot be routed. The intent recognition confidence threshold (70%) MUST be tunable based on user testing results.

### Visual Choreography

Mode switching MUST use progressive disclosure: advanced mode adds raw terms in parentheses, additional controls, and hidden sections without restructuring the simple-mode layout. This follows the Open WebUI progressive enhancement pattern identified in design research. Transitions between modes SHOULD complete within 200ms to maintain perceived responsiveness. Panel switching (dialog/workflow/terminal) MUST preserve scroll position and input state per UI-04.

### Streaming

Three streaming surfaces require coordinated behavior: AI Dialog streams Claude output with typing indicator (within 200ms of first token), Terminal Bridge streams PTY output via xterm.js (within 100ms of data chunk), and Workflow Commander streams step progress via State Sync Engine events (within 500ms of state change). All streaming surfaces MUST show a visible activity indicator during data flow and a clear complete state when streaming ends. Auto-scroll behavior MUST pause when the user scrolls up and resume when the user returns to the bottom.

### Confirmation

The Approval Gate (F-007) is the primary confirmation mechanism. It MUST present inline within the active panel rather than as a modal overlay. Three review tabs (Summary, Diff Preview, Dry-Run Result) provide progressive detail. High-risk operations MUST require an explicit confirmation checkbox in addition to the Approve button. The Reject action MUST require a reason field to feed context back to the AI iteration loop. The gate MUST NOT auto-approve any configured approval step.

### Interrupt

Workflow cancellation MUST be available at every step via a visible Stop control in the Workflow Commander. The Approval Gate allows pausing workflow execution indefinitely while the user reviews. Users SHOULD be able to interact with other panels while an approval is pending - the gate MUST NOT block the entire interface. WebSocket disconnection MUST trigger a syncing indicator across all panels; stale data MUST NOT be presented as current.

### Accessibility

All visual status indicators MUST convey meaning through color, shape, and icon simultaneously (WCAG 2.1 AA). Diff previews in the Approval Gate MUST be screen-reader navigable. Keyboard navigation MUST cover all three decision controls (Approve, Reject, Modify) and all review tabs. The mode toggle MUST be keyboard-accessible. Focus management MUST move to the Approval Gate when it triggers and return to the previous focus point after the user acts.

## 4. File Index

| File | Type | Feature | Headings |
|------|------|---------|----------|
| [analysis-F-001-workflow-commander.md](analysis-F-001-workflow-commander.md) | feature | F-001 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-002-project-radar.md](analysis-F-002-project-radar.md) | feature | F-002 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-003-ai-dialog.md](analysis-F-003-ai-dialog.md) | feature | F-003 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-004-terminal-bridge.md](analysis-F-004-terminal-bridge.md) | feature | F-004 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-005-state-sync-engine.md](analysis-F-005-state-sync-engine.md) | feature | F-005 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-006-concept-translator.md](analysis-F-006-concept-translator.md) | feature | F-006 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [analysis-F-007-approval-gate.md](analysis-F-007-approval-gate.md) | feature | F-007 | Architecture, Interface Contract, Constraints (RFC 2119), Test Approach, TODOs |
| [findings-concept-abstraction-leak.md](findings-concept-abstraction-leak.md) | finding | - | Description, Affected Features, Recommendation |
| [findings-dual-mode-consistency.md](findings-dual-mode-consistency.md) | finding | - | Description, Affected Features, Recommendation |

## 5. Outstanding TODOs

- Define the complete intent-to-workflow mapping table with the Concept Translator team (F-001, F-006).
- Validate intent recognition confidence thresholds through user testing (F-001, F-003).
- Design the Run again workflow history pattern and persistence strategy (F-001).
- Specify the transition behavior when a workflow step triggers an approval gate mid-execution (F-001, F-007).
- Define the visual vocabulary for step statuses (icons, colors, animations) in collaboration with the UI Designer (F-002).
- Specify the recommended next step algorithm - rule-based vs. AI-suggested (F-002).
- Design the disconnection/reconnection state transition and user notification pattern (F-002, F-005).
- Determine the information density trade-off for compact left-nav status display vs. full Radar view (F-002).
- Define the action card UI pattern for confirmed vs. dismissed intents (F-003).
- Specify conversation persistence scope - session-only vs. cross-session vs. project-scoped (F-003).
- Design the thinking state animation and timeout behavior for AI processing delays (F-003).
- Determine the interaction between AI Dialog and Terminal Bridge for output redirection (F-003, F-004).
- Define the annotation parsing rules for maestro CLI output patterns (F-004).
- Design the simple/advanced mode toggle UX for terminal input permissions (F-004).
- Specify the behavior when the user runs a maestro command in their external terminal (F-004).
- Determine auto-scroll threshold and new output indicator pattern (F-004).
- Define the event taxonomy and granularity in collaboration with the System Architect (F-005).
- Specify the reconnection buffering strategy and replay protocol (F-005).
- Design the cross-panel connection state indicator pattern (F-005).
- Complete the full terminology map including error message patterns and CLI output fragments (F-006).
- Define the generic error container pattern for untranslatable error messages (F-006).
- Specify the configuration format for the extensible terminology map (F-006).
- Validate translated labels with actual maestro users for comprehension and clarity (F-006).
- Define the risk-level classification criteria for approval steps (F-007).
- Design the Modify parameter adjustment UI - inline editing vs. redirect to a form (F-007).
- Specify the rejection reason flow - how rejection context feeds back into the AI iteration loop (F-007).
- Determine the timeout behavior for pending approvals (F-007).
- Implement regression tests that scan the simple-mode UI for untranslated technical terms (cross-cutting, see findings-concept-abstraction-leak).
- Define the global mode state management pattern and persistence mechanism (cross-cutting, see findings-dual-mode-consistency).
