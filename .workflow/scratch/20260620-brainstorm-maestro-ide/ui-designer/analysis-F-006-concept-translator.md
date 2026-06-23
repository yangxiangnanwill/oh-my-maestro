# F-006 — Concept Translator

> Role: ui-designer | Related decisions: UX-01, UX-03, UX-04, UI-03

## Architecture

The Concept Translator is a UI-layer mapping system that intercepts raw maestro terminology before it reaches any visual component. It operates as a Svelte store or utility function that components call to resolve display labels.

```
Raw Term --> ConceptTranslator.resolve() --> Display Label

Examples:
  "chain"       --> "Workflow"
  "skill"       --> "Action" / "Step" (context-dependent)
  "delegate"    --> (hidden, auto-triggered)
  "phase"       --> "Stage"
  "milestone"   --> "Goal"
  "artifact"    --> "Output"
  "session"     --> (hidden, not exposed)
```

The translator supports two modes per UX-04: simple mode (user-friendly labels) and advanced mode (original terms shown as secondary information).

## Interface Contract

| Component | Props / Data Shape | Consumers |
|-----------|-------------------|-----------|
| ConceptTranslator | `{ resolve(term: string, context?: string): TranslatedTerm }` | All UI components |
| TranslatedTerm | `{ display: string, original?: string, tooltip?: string }` | Labels, badges, headers |
| ModeToggle | `{ mode: 'simple' | 'advanced', onToggle: () => void }` | Settings, header |

In simple mode, `TranslatedTerm.original` is undefined. In advanced mode, it contains the raw maestro term and the tooltip shows both.

## Constraints (RFC 2119)

- Every user-facing label MUST pass through ConceptTranslator.resolve(); raw maestro terms MUST NOT appear in the UI in simple mode, per UX-01.
- The translation mapping MUST follow the table defined in guidance section 2 Concepts and Terminology.
- In advanced mode, the original term SHOULD appear as a secondary label or tooltip, per UX-04.
- Error messages from the backend MUST also pass through the translator; if a raw term appears in an error string, the UI MUST attempt to replace it with the translated equivalent.
- The translator MUST be context-aware: "skill" translates to "Action" in the workflow selector and "Step" in the progress view.
- The mode toggle MUST persist across sessions (localStorage or user preferences).

## Test Approach

- Unit: ConceptTranslator.resolve returns correct display labels for all known terms; context-aware resolution works.
- Integration: Every component in the application uses the translator; no raw terms leak in simple mode.
- Edge case: Unknown terms (pass through unchanged); terms embedded in longer strings (partial replacement).

## TODOs

- Build the complete term-to-label mapping table with context variants.
- Define the error message translation strategy (regex replacement vs. structured error payloads).
- Design the mode toggle placement in the UI (settings panel vs. header toggle).
- Coordinate with UX on the advanced mode information density.
