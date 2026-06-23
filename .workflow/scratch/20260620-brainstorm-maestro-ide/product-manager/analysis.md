# Product Manager Analysis — Maestro IDE

> Contract: guidance-specification.md §4 (decisions PM-01 through PM-06)
> Owns: Product positioning, user segment strategy, feature prioritization, MVP scope, success metrics, roadmap phasing
> Does not own: Technical architecture (SA-*), UX interaction design (UX-*), UI visual design (UI-*)

## 1. Role Mandate (<= 200 words)

The Product Manager defines what Maestro IDE is and for whom. This role owns the product positioning as a terminal companion (PM-01), the dual user segment strategy (PM-02), and the MVP core value of workflow orchestration plus status visualization (PM-03). The PM decides feature prioritization and phasing, ensuring the product delivers measurable value to both maestro existing users and Claude Code new users without scope creep. The PM defers technical architecture decisions to the System Architect, interaction design to the UX Expert, and visual design to the UI Designer. The PM mandate is to ensure every feature shipped contributes to the core value proposition and that the product resists the gravitational pull toward becoming a complete AI development platform — a stated risk in the guidance specification.

## 2. Decision Digest

### Decisions
| ID | Feature | Stance | Constraints (RFC 2119) |
|----|---------|--------|------------------------|
| PM-01 | cross-cutting | Product is a terminal companion, not a replacement | MUST position as auxiliary; MUST NOT replace terminal or editor |
| PM-02 | cross-cutting | Dual segment strategy: maestro users first, Claude Code new users second | MUST prioritize existing user pain points; MUST accommodate new users via Concept Translator |
| PM-03 | F-001, F-002 | MVP core value is workflow orchestration + status visualization | MUST deliver these two capabilities before any other feature |
| PM-04 | F-001 | One-click workflow trigger with optional step-by-step fallback | SHOULD support single-action trigger; MUST retain individual step access |
| PM-05 | cross-cutting | Product does not replace code editor | MUST NOT build editor capabilities; users keep their existing editors |
| PM-06 | F-001, F-006 | Workflow grouping and concept encapsulation | SHOULD group workflows by scenario; MUST NOT expose raw command taxonomy as primary interface |
| PM-07 | F-001, F-005 | Foundation-first delivery order | MUST deliver F-005 and F-006 before dependent features |
| PM-08 | F-002 | State-oriented entry point with recommended next action | MUST show current state + recommendation; MUST link recommendation to F-001 |
| PM-09 | F-003 | Natural language as alternate entry, not sole entry | MUST NOT make AI Dialog the only workflow trigger; Workflow Commander MUST remain directly accessible |
| PM-10 | F-007 | Approval gate is trust-critical, not MVP-blocking | SHOULD include in MVP; MUST NOT auto-approve destructive actions |
| PM-11 | F-004 | Terminal Bridge is transparency layer, not primary terminal | MUST display real-time CLI output; MUST NOT replace user terminal or editor |

### Interfaces
| Name | Contract | Consumers |
|------|----------|-----------|
| Workflow Catalog | GET /api/workflows — grouped workflow list with metadata | F-001 (Workflow Commander), F-003 (AI Dialog intent routing) |
| Project State | GET /api/projects/{id}/state — milestone/phase/step hierarchy | F-002 (Project Radar), F-001 (workflow context) |
| Recommendation Engine | Computed next-step from state + workflow catalog | F-002 (Project Radar display), F-001 (trigger link) |
| Intent Classification | Natural language to workflow ID or conversation mode | F-003 (AI Dialog routing) |
| Translation Map | Technical term to user-facing label + display mode filter | All UI surfaces via F-006 |

### Cross-Cutting Positions
| Topic | Stance |
|-------|--------|
| Product scope | Terminal companion only; MUST NOT expand to IDE or team collaboration |
| User segments | Maestro existing users are the primary beachhead; Claude Code new users are growth |
| Feature phasing | Foundations (F-005, F-006) before core (F-001, F-002) before surfaces (F-003, F-004) before trust (F-007) |
| Differentiation | Workflow orchestration is the unique value; AI chat is necessary but commoditized |
| Concept abstraction | Simple mode default; advanced mode unlock; no raw terminology in default experience |
| MVP boundary | 7 features defined in guidance spec; no additions without explicit stakeholder approval |

### Findings Summary
| Slug | Title | Impact |
|------|-------|--------|
| scope-creep-risk | MVP Scope Creep Risk from Feature Interdependencies | HIGH — F-005 and F-006 are blockers for most other features |
| user-segment-tension | Dual User Segment Creates Design Tension | MEDIUM — opposing needs require layered display model |
| competitive-differentiation | Competitive Differentiation Through Workflow Orchestration | MEDIUM — must lean into orchestration, not AI chat |

## 3. Cross-Cutting Foundations

### Personas

Two primary personas drive product decisions:

**Persona A — The Reluctant CLI User (maestro existing user)**
- Understands workflow concepts but finds 60+ commands tedious to remember and type
- Wants speed: one-click triggers, keyboard shortcuts, quick access to specific commands
- Tolerates technical terminology; prefers advanced mode with raw concepts visible
- Uses terminal daily; sees GUI as an accelerator, not a replacement

**Persona B — The AI-Curious Developer (Claude Code new user)**
- Wants AI-assisted development but is intimidated by CLI
- Thinks in natural language: I want to add a login feature not maestro delegate --to claude
- Needs guidance: recommended next actions, visual status, translated terminology
- Sees the GUI as the primary interface; may rarely touch the terminal

### Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Workflow trigger rate (GUI vs CLI) | > 60% GUI within 3 months | Validates that GUI provides genuine value over CLI |
| Time-to-first-workflow | < 2 minutes from app open | New users must reach value quickly |
| State sync accuracy | > 99% within 5 seconds | Trust requires that GUI reflects reality |
| Concept translation coverage | 100% of user-facing strings | No raw terminology leak in simple mode |
| Approval gate usage | > 80% of destructive actions reviewed | Safety net is being used, not bypassed |

### Roadmap Shape

Phase delivery order, informed by the dependency analysis in findings-scope-creep-risk:

1. **Foundation Phase** — F-005 (State Sync Engine) + F-006 (Concept Translator)
   - These are cross-cutting prerequisites; no other feature works without them.
   - Delivers no user-facing value alone but unblocks everything else.

2. **Core MVP Phase** — F-002 (Project Radar) + F-001 (Workflow Commander)
   - These two features deliver the core value proposition (PM-03).
   - Project Radar is the entry point; Workflow Commander is the action surface.

3. **Interaction Phase** — F-004 (Terminal Bridge) + F-003 (AI Dialog)
   - Terminal Bridge provides transparency; AI Dialog provides natural language access.
   - Both enhance the core but are not required for the initial value delivery.

4. **Trust Phase** — F-007 (Approval Gate)
   - Approval Gate completes the trust model for autonomous workflow execution.
   - Can be shipped incrementally — start with high-risk actions only, expand coverage.

### Prioritization Rationale

The prioritization follows three principles:
- **Unblock before deliver**: F-005 and F-006 MUST ship first because they are dependencies for all other features.
- **Core before enhancement**: F-001 and F-002 deliver the stated MVP value; everything else is enhancement.
- **Trust before scale**: F-007 is critical for user trust but not blocking for initial adoption; it can follow the interaction surfaces.

This order ensures that each phase produces a usable increment. The Foundation Phase produces a working state sync and translation layer. The Core MVP Phase produces a product that users can open, see their project status, and trigger workflows. The Interaction Phase makes it accessible via natural language and transparent via terminal view. The Trust Phase makes it safe for production use.

## 4. File Index

| File | Type | Feature | Headings |
|------|------|---------|----------|
| [analysis-F-001-workflow-commander.md](analysis-F-001-workflow-commander.md) | feature | F-001 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [analysis-F-002-project-radar.md](analysis-F-002-project-radar.md) | feature | F-002 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [analysis-F-003-ai-dialog.md](analysis-F-003-ai-dialog.md) | feature | F-003 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [analysis-F-004-terminal-bridge.md](analysis-F-004-terminal-bridge.md) | feature | F-004 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [analysis-F-005-state-sync-engine.md](analysis-F-005-state-sync-engine.md) | feature | F-005 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [analysis-F-006-concept-translator.md](analysis-F-006-concept-translator.md) | feature | F-006 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [analysis-F-007-approval-gate.md](analysis-F-007-approval-gate.md) | feature | F-007 | Architecture, Interface Contract, Constraints, Test Approach, TODOs |
| [findings-scope-creep-risk.md](findings-scope-creep-risk.md) | finding | — | Description, Affected Features, Recommendation |
| [findings-user-segment-tension.md](findings-user-segment-tension.md) | finding | — | Description, Affected Features, Recommendation |
| [findings-competitive-differentiation.md](findings-competitive-differentiation.md) | finding | — | Description, Affected Features, Recommendation |

## 5. Outstanding TODOs

- Validate the scenario group taxonomy for Workflow Commander with actual maestro users — the initial grouping is assumed, not researched.
- Define the recommendation algorithm for Project Radar next step feature — rule-based is simpler but may miss edge cases.
- Specify the intent classification strategy for AI Dialog — LLM-based is more accurate but adds latency and cost.
- Determine the terminal interactivity scope for Terminal Bridge — full interactive PTY vs. read-only log view.
- Design the approval granularity model for Approval Gate — per-step vs. per-workflow vs. configurable.
- Conduct competitive analysis on Cline approval UX and Continue.dev slash command system for reusable patterns.
- Define the onboarding flow for first-time users — how a new user discovers and triggers their first workflow.
- Establish the CLI version coupling strategy — how the product handles maestro CLI updates that change output formats or command structures.

