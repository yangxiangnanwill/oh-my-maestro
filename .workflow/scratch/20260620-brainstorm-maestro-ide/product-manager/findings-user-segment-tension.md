# Finding: Dual User Segment Creates Design Tension

> Role: product-manager | Impact: MEDIUM

## Description

The product serves two distinct user segments (PM-02): maestro existing users who understand workflows but find CLI tedious, and Claude Code new users who lack any mental model of maestro. These segments have opposing needs:

- **Existing users** want speed and power — keyboard shortcuts, quick access to specific commands, advanced mode with raw terminology.
- **New users** want simplicity and guidance — visual cues, recommended actions, simple mode with translated terminology.

Design research confirms this tension: "Ignoring CLI power users" is a named pitfall. The GUI MUST NOT block CLI-native workflows, and the product must serve both segments without creating two separate interfaces.

## Affected Features

F-001 (Workflow Commander), F-003 (AI Dialog), F-006 (Concept Translator) — these features must accommodate both interaction patterns simultaneously.

## Recommendation

Adopt the layered display model (UX-04) as a first-class product principle. Every feature MUST be designed with a "simple default + advanced unlock" pattern. The default experience targets new users; a toggle or progressive disclosure mechanism reveals power-user capabilities. This ensures the product ships one coherent experience, not two parallel ones.

> **Cross-Role Synergy (S-001)**: All four roles identify concept leak as critical — unified defense: SA middleware + UI ConceptTranslator + UX rendering rules + shared regression test suite
