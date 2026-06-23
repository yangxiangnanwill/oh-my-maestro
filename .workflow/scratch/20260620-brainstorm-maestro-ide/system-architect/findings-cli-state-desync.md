# Finding: CLI-GUI State Desynchronization

> Role: system-architect | Impact: HIGH

## Description

Guidance section 9 identifies "terminal and GUI state conflict" as a risk: users may operate both the CLI and GUI simultaneously, leading to state desynchronization. The design research confirms this: "If a user runs `maestro delegate` in their terminal, the GUI should reflect that state, not conflict with it."

The current architecture relies on file-system watchers (F-002) and WebSocket events (F-005) for state propagation. However, if a user modifies project state via an external terminal, the file-system watcher detects the change but the GUI has no causal context (no associated execution event). This creates a gap where the GUI shows updated state but cannot explain why or recommend next steps accurately.

## Affected Features

- F-002 (Project Radar): Must detect and display externally-triggered state changes.
- F-005 (State Sync Engine): Must propagate file-system-sourced events alongside process-sourced events.
- F-006 (Concept Translator): Error messages from external CLI operations may bypass the translation layer.

## Recommendation

Implement a dual-source state model: the State Sync Engine MUST merge events from two sources (1) in-process CLI executions (rich context: executionId, stepIndex, intent) and (2) file-system watchers (minimal context: changed paths, timestamps). When a file-system event has no corresponding execution event, the system MUST mark it as "externally triggered" in the UI. This maintains transparency without requiring the GUI to control all user actions.

> **Cross-Role Synergy (S-002)**: Dual-source state model validated against PM 99% accuracy metric + UX 500ms latency bar — single acceptance criteria set for F-005
