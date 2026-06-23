# F-006 — Concept Translator

> Role: ux-expert | Related decisions: UX-01, UX-03, UX-04

## Architecture

The Concept Translator is the linguistic layer that maps maestro technical concepts to user-facing language per UX-03. It is the backbone of UX-01 (concept hiding) and enables the layered display model (UX-04). The architecture has two components:

1. **Terminology Map** — A bidirectional mapping table derived from guidance §2. Key mappings:
   - "chain" <-> "Workflow"
   - "skill" <-> "Action" / "Step"
   - "delegate" <-> (hidden, auto-triggered)
   - "phase" <-> "Stage"
   - "milestone" <-> "Goal" / "Milestone"
   - "artifact" <-> "Output" / "Result"
   - "session" <-> (hidden, not exposed)

   The mapping MUST be maintained as a centralized dictionary so that all UI surfaces consume the same translations. The map MUST include a "hidden" category for concepts that MUST NOT appear in simple mode at all.

2. **Layer Selector** — Determines which concepts to show based on the active display mode:
   - **Simple mode**: Shows only translated terms; hides "delegate", "session", and other internal concepts; uses plain-language descriptions.
   - **Advanced mode**: Shows translated terms with raw technical terms in parentheses (e.g., "Workflow (chain)"); exposes all concepts including normally hidden ones.

The Translator MUST be consumed as a function or service, not as hardcoded strings, so that mode switching is instantaneous without page reload.

## Interface Contract

- **translate(term: string, mode: 'simple'|'advanced'): string** — Returns the user-facing label for a technical term. In advanced mode, appends the raw term in parentheses.
- **shouldHide(term: string, mode: 'simple'|'advanced'): boolean** — Returns true if the concept should be completely hidden in the given mode.
- **describeWorkflow(chainId: string, mode: 'simple'|'advanced'): { title, description, steps: Array<TranslatedStep> }** — Produces a fully translated workflow description.

## Constraints (RFC 2119)

- The Terminology Map MUST cover every maestro concept listed in guidance §2; no technical term MAY appear in the simple-mode UI without a translation entry.
- Concepts marked "hidden" in the mapping MUST NOT be rendered in simple mode under any circumstance, including error messages.
- Error messages from the CLI MUST pass through the translator before display; raw maestro error text containing untranslatable terms MUST be wrapped in a generic error container with a "Show details" disclosure for advanced mode.
- The layer selector MUST switch modes without page reload; the transition SHOULD complete within 200ms.
- The Terminology Map SHOULD be extensible via configuration, not hardcoded, to accommodate new maestro concepts in future versions.

## Test Approach

- **Unit**: Verify every entry in guidance §2 terminology table has a corresponding mapping; verify `shouldHide` returns true for hidden concepts in simple mode and false in advanced mode.
- **Integration**: Walk through every UI surface in simple mode and verify zero occurrences of untranslated technical terms.
- **Edge case**: Inject a raw maestro error message and verify it is properly contained and translated before display.
- **Usability**: Present translated terminology to target users and verify comprehension matches or exceeds the raw technical terms for maestro-experienced users.

## TODOs

- Complete the full terminology map including error message patterns and CLI output fragments.
- Define the "generic error container" pattern for untranslatable error messages.
- Specify the configuration format for the extensible terminology map.
- Validate translated labels with actual maestro users for comprehension and clarity.
