# Finding: Concept Abstraction Leak Risk

> Role: ux-expert | Impact: HIGH

## Description

The guidance specification identifies "concept abstraction leakage" as a key risk (guidance §9, item 3): deeply hiding maestro concepts increases the likelihood that error messages, stack traces, or unexpected states expose raw technical terms like "chain", "delegate", or "session" to simple-mode users. This risk is amplified because the maestro CLI outputs raw terminology in its error messages, and the Concept Translator (F-006) can only translate terms it knows about. Novel error patterns, version-specific messages, or stack traces will bypass the translation layer.

Design research confirms this pitfall: "GUI shallowness" and "terminal passthrough without structured output" both describe scenarios where the GUI fails to add value because it leaks implementation details. The Cline reference project handles this by wrapping all AI output in structured action objects, but maestro's CLI output is less structured.

## Affected Features

- F-006 Concept Translator — the primary defense, but limited to known terminology.
- F-003 AI Dialog — streams AI output that may contain untranslated terms.
- F-004 Terminal Bridge — displays raw CLI output that inherently contains technical terms.
- F-007 Approval Gate — diff previews may reference internal maestro paths or IDs.

## Recommendation

1. Implement a defensive rendering layer that wraps all user-facing text in a `translate()` call, even for content not expected to contain technical terms. Unknown terms pass through unchanged rather than breaking.
2. Define a "catch-all" error container pattern: when the translator encounters an untranslatable error, it wraps the raw text in a collapsible "Technical Details" section with a plain-language summary above it.
3. Mandate that the Terminal Bridge (F-004) in simple mode MUST NOT display raw CLI output by default — it SHOULD show only annotated summaries, with full output available via a "Show raw output" disclosure.
4. Add regression tests that scan the simple-mode UI for any occurrence of untranslated technical terms from the guidance §2 terminology list.

> **Cross-Role Synergy (S-001)**: UX rendering rules + SA middleware + UI ConceptTranslator form unified defense — shared regression test validates all layers
