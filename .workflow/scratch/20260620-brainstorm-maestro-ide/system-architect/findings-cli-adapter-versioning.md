# Finding: CLI Adapter Versioning Strategy

> Role: system-architect | Impact: HIGH

## Description

The design research identifies "coupling to single Claude Code CLI version" as a key pitfall. The CLI adapter layer (SA-06) must handle version drift gracefully, but the current guidance does not specify a versioning or compatibility strategy. Without a concrete approach, any CLI output format change will break the entire frontend.

The adapter layer requires a version detection mechanism at startup. The `maestro --version` output can be parsed to select the appropriate adapter implementation. Each adapter version maps to a known CLI output schema.

## Affected Features

- F-001 (Workflow Commander): Relies on CLI adapter for structured workflow catalog and execution events.
- F-003 (AI Dialog): Streaming bridge pipes through the adapter.
- F-007 (Approval Gate): Diff extraction depends on CLI output parsing.

## Recommendation

Implement a versioned adapter registry: at server startup, query `maestro --version`, select the matching adapter, and fail fast with a clear error if no compatible adapter exists. Each adapter MUST be a separate module with its own test fixtures. Add a CI gate that runs adapter tests against the latest maestro CLI release.

> **Cross-Role Synergy (S-001)**: Adapter versioning is the first line of defense for concept leak — versioned adapters ensure translation coverage matches CLI output format changes
