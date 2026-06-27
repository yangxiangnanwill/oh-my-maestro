# TASK-013 Summary — 扩展 agent-setup: Agent wrappers + CLI shells

**Status**: completed
**Completed at**: 2026-06-26T00:00:00+08:00
**Duration**: ~30 min

## Verification Results

### Done When Checklist

- [x] agent-setup/ 包含 6+ agent wrappers (10 agents: amp, claude, codex, droid, opencode, pi, cursor-agent, gemini, mastracode, copilot)
- [x] 不含 @superset/agent 导入（已替换或标记 TODO）

### Key Findings

Agent wrappers and shell wrappers were already migrated from Superset source in prior Phase 3 tasks. This task was an audit/verification pass.

### Changes Made

| File | Change |
|---|---|
| `maestro-mcp-provider.ts:31` | Exported `MaestroCliTool` interface (was `interface`, now `export interface`) to fix TS2459 in tRPC router |
| `desktop-agent-capabilities.ts:1-3` | Updated Phase 3 stub comment to reference Maestro shared module instead of `@superset/shared/agent-command` |

### Agent Wrappers Inventory

| Agent | Wrapper File | Key Exports |
|---|---|---|
| AMP | `agent-wrappers-amp.ts` | `createAmpPlugin`, `createAmpWrapper` |
| Claude | `agent-wrappers-claude-codex-opencode.ts` | `createClaudeSettingsJson`, `createClaudeWrapper` |
| Codex | `agent-wrappers-claude-codex-opencode.ts` | `createCodexHooksJson`, `createCodexWrapper` |
| OpenCode | `agent-wrappers-claude-codex-opencode.ts` | `createOpenCodePlugin`, `createOpenCodeWrapper` |
| Copilot | `agent-wrappers-copilot.ts` | `createCopilotHookScript`, `createCopilotWrapper` |
| Cursor | `agent-wrappers-cursor.ts` | `createCursorAgentWrapper`, `createCursorHookScript` |
| Droid | `agent-wrappers-droid.ts` | `createDroidSettingsJson`, `createDroidWrapper` |
| Gemini | `agent-wrappers-gemini.ts` | `createGeminiHookScript`, `createGeminiWrapper`, `createGeminiSettingsJson` |
| Mastra | `agent-wrappers-mastra.ts` | `createMastraHooksJson`, `createMastraWrapper` |
| Pi | `agent-wrappers-pi.ts` | `createPiExtension` |

### Support Files

| File | Purpose |
|---|---|
| `shell-wrappers.ts` | Zsh/Bash/Fish shell wrapper generation |
| `utils.ts` | Binary path resolution (findRealBinary, filterBinDirectories) |
| `agent-wrappers-common.ts` | Shared wrapper utilities (buildWrapperScript, getWrapperPath) |
| `notify-hook.ts` | Agent lifecycle notification hook script |
| `desktop-agent-setup.ts` | Orchestrates setup of all agent capabilities |
| `desktop-agent-capabilities.ts` | Agent type definitions and setup targets |
| `paths.ts` | Resolves paths using `MAESTRO_HOME_DIR` |
| `env-shared-stub.ts` | Phase 3 stub for `DESKTOP_NOTIFICATIONS_PORT` |
| `superset-registry.d.ts` | Type declaration stub for optional Superset MCP registry |
| `maestro-mcp-provider.ts` | Maestro MCP tools bridge |

### Remaining @superset References (Intentional)

All three are correctly handled:

1. `superset-registry.d.ts` — Phase 3 type declaration stub for dynamic import
2. `maestro-mcp-provider.ts:570` — Dynamic `import()` inside try-catch (fallback path)
3. `desktop-agent-capabilities.ts:1` — Phase 3 TODO comment

No actual `import ... from "@superset/..."` statements exist in any agent-setup file.
