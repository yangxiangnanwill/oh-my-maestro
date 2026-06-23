# F-006 — Concept Translator

> Role: system-architect | Related decisions: SA-06, UX-03

## Architecture

Concept Translator maps internal maestro terminology to user-facing language. This is a pure data transformation layer with no side effects.

1. **Translation Registry**: A key-value map loaded from a configuration file (`translations.json`). Keys are maestro technical terms; values are structured objects containing the user-facing label, description, and detail level (simple/advanced).

2. **Translator Middleware**: Intercepts all backend responses before they reach the WebSocket/REST layer. Applies term substitution based on the user's selected detail level. Operates recursively on JSON response payloads.

3. **Detail Level Toggle**: The frontend sends the current detail level (simple/advanced) as a header or query parameter. The translator adjusts output accordingly: simple mode replaces terms and hides internal-only fields; advanced mode preserves original terminology.

Module layout:
```
server/
  middleware/
    concept-translator.ts         # response interceptor
  data/
    translations.json             # term mapping registry
  types/
    translation.ts                # TranslationEntry type
client/
  stores/
    detail-level.ts               # Svelte store for simple/advanced toggle
```

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| `Translator.translate(payload, level)` | Internal | Returns transformed payload with terms replaced |
| `GET /api/translations` | Backend -> Frontend | `{ terms: TranslationEntry[] }` for client-side rendering |
| `X-Detail-Level: simple|advanced` | Frontend -> Backend | HTTP header / WS connection parameter |

Consumers: All frontend components consume translated responses; the translation registry is also exposed to UX layer for tooltip rendering.

## Constraints (RFC 2119)

- The translation registry MUST cover all terms listed in guidance specification section 2 (chain, skill, delegate, phase, artifact, etc.).
- Translation MUST be applied consistently across all REST and WebSocket responses; no raw technical terms MUST leak in simple mode.
- The translator MUST NOT modify data values (only keys and labels); structured data integrity MUST be preserved.
- Adding a new translation entry MUST NOT require a server restart; the registry SHOULD support hot-reload.
- Error messages from the CLI adapter MUST pass through the translator before reaching the frontend.

## Test Approach

- **Unit**: Translator with fixture payloads covering all registered terms at both detail levels.
- **Integration**: End-to-end response through middleware chain, verifying no raw terms in simple mode.
- **Regression**: Snapshot tests on translated outputs to catch accidental removals from the registry.

## TODOs

- Define the complete translation map for all maestro terms from guidance section 2.
- Determine how to handle untranslated terms (pass-through vs. placeholder).
- Evaluate whether the frontend needs the full translation map or only the current-level labels.
