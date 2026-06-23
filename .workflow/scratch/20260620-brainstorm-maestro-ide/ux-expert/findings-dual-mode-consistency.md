# Finding: Dual-Mode Interaction Consistency

> Role: ux-expert | Impact: MEDIUM

## Description

The guidance specification mandates a layered display mode (UX-04): simple mode hides details while advanced mode exposes raw concepts. This creates a consistency challenge across seven features. If the mode toggle behaves differently per panel, or if switching modes produces jarring layout shifts, users will lose trust in the interface. The risk is particularly acute for F-004 Terminal Bridge (where simple mode restricts input) and F-003 AI Dialog (where simple mode hides slash commands), because mode changes alter interaction affordances, not just displayed terminology.

Design research on Open WebUI's progressive enhancement pattern offers a solution: features are layered, and each layer activates gracefully without restructuring the interface. The maestro IDE SHOULD follow this pattern — mode switching adds information and controls rather than replacing the layout.

## Affected Features

- All seven features — mode switching is a cross-cutting interaction pattern.
- F-004 Terminal Bridge — input restriction in simple mode is the most invasive mode-dependent behavior.
- F-006 Concept Translator — the engine that powers mode-dependent display.

## Recommendation

1. Define a global mode state that all panels consume; mode MUST NOT be toggled independently per panel.
2. Mode switching MUST use progressive disclosure: advanced mode adds elements (raw terms in parentheses, additional controls, hidden sections) rather than replacing simple-mode elements.
3. The mode toggle SHOULD be persistent (stored in user preferences) and accessible from the global navigation, not buried in a settings page.
4. When a user in simple mode encounters a situation that requires advanced features (e.g., an error that needs raw CLI output to diagnose), the system SHOULD suggest switching to advanced mode with a contextual prompt explaining why.
