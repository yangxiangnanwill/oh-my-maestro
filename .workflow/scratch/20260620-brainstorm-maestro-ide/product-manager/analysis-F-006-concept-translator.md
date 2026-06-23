# F-006 — Concept Translator

> Role: product-manager | Related decisions: PM-02, PM-06

## Architecture

Concept Translator is the layer that makes maestro accessible to non-CLI users. Per UX-01 and UX-03, the product MUST hide maestro's technical concepts and present user-friendly language. This feature implements the mapping defined in the guidance specification's terminology table (Section 2).

From the product perspective, Concept Translator is essential for serving the Claude Code new user segment (PM-02). These users do not know what a "chain", "skill", or "delegate" is — they think in terms of "workflows", "actions", and automated steps. The translator bridges this gap.

The feature also supports the layered display model (UX-04): simple mode hides technical details, advanced mode reveals them. This is critical for serving both user segments without alienating either.

## Interface Contract

| Interface | Direction | Shape |
|-----------|-----------|-------|
| Translation Map | Consumes | Static mapping table: `{ technical: "chain", userFacing: "Workflow", description: "..." }` |
| Display Mode | Consumes | User preference — "simple" or "advanced" |
| Translated Output | Emits | All user-facing strings filtered through the translation layer based on display mode |

## Constraints (RFC 2119)

- Concept Translator MUST map all maestro technical terms to user-facing equivalents as defined in the terminology table (UX-03).
- Error messages from maestro CLI MUST be translated before display — raw technical terms MUST NOT leak to users in simple mode (UX-01).
- The system SHOULD support a toggle between simple and advanced display modes (UX-04).
- In advanced mode, technical terms MAY be shown alongside user-facing labels for educational purposes.
- The translation layer MUST be applied consistently across all UI surfaces — Project Radar, Workflow Commander, AI Dialog, and Terminal Bridge.

## Test Approach

- **Unit**: Translation mapping — verify that every technical term in the maestro vocabulary has a user-facing equivalent.
- **Integration**: Error message translation — trigger a maestro error, verify the displayed message uses user-facing language.
- **E2E**: User switches between simple and advanced modes, observes that terminology changes consistently across all panels.
- **Edge case**: Unmapped term — a new maestro concept appears that is not in the translation table; verify graceful fallback (display raw term with a "technical" badge).

## TODOs

- Complete the full translation map for all 60+ maestro commands and concepts.
- Define the error message translation strategy — pattern matching vs. LLM-based rewriting.
- Specify how the display mode preference is persisted and applied.
- Determine the process for keeping the translation map in sync with maestro CLI updates.
