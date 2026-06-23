# Finding: Dark Theme Contrast and Accessibility Requirements

> Role: ui-designer | Impact: HIGH

## Description

The product mandates a dark theme as default (UI-02), which introduces specific contrast and readability challenges. All component states, status badges, and diff previews must maintain WCAG AA contrast ratios against dark backgrounds. The design-research references (Cline, Cursor, Windsurf) all use dark themes but vary in their approach to status color differentiation. A consistent, accessible dark palette must be defined before component implementation begins.

The xterm.js terminal (F-004) presents a unique challenge: terminal color schemes are typically 16-color ANSI palettes that may not align with the application's design tokens. The terminal theme MUST be coordinated with the overall dark palette to avoid visual dissonance.

## Affected Features

- F-001 Workflow Commander: Step status colors (PENDING, RUNNING, DONE, FAILED) must be distinguishable in dark mode.
- F-002 Project Radar: Progress gauge states (on-track, at-risk, blocked) require high-contrast color coding.
- F-003 AI Dialog: Markdown code block syntax highlighting must use a dark-compatible theme.
- F-004 Terminal Bridge: xterm.js color scheme must harmonize with the application dark theme.
- F-007 Approval Gate: Diff preview (additions/removals) must use colors that are distinguishable for color-blind users.

## Recommendation

Define a design token system for the dark theme before component development. Include:
1. A status color palette with WCAG AA compliance verified against the dark background.
2. A terminal color scheme that maps ANSI colors to design tokens.
3. Diff preview colors that use both hue and pattern (e.g., green with + prefix, red with - prefix) for color-blind accessibility.
4. A syntax highlighting theme for Markdown code blocks that matches the dark palette.
