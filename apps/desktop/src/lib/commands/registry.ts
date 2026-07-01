/**
 * Static Command Registry — read-only whitelist for the Command Palette.
 *
 * Only commands with riskLevel="read" are included in this MVP registry.
 * The old MAESTRO_TOOL_CATALOG in maestro-mcp-provider.ts is preserved
 * unchanged and still used by the MCP provider for its own purposes.
 *
 * This registry is the data source for the tRPC commands.list procedure.
 */

import type { CommandDefinition } from "./types";

// ---------------------------------------------------------------------------
// Read-only command registry
// ---------------------------------------------------------------------------

export const COMMAND_REGISTRY: readonly CommandDefinition[] = [
	// -- ralph ---------------------------------------------------------------
	{
		id: "ralph-skills",
		label: "cmd.ralph_skills",
		category: "ralph",
		cliCommand: "maestro",
		cliArgs: ["ralph", "skills"],
		description: "cmd.ralph_skills.desc",
		outputKind: "table",
		riskLevel: "read",
	},
	{
		id: "ralph-check",
		label: "cmd.ralph_check",
		category: "ralph",
		cliCommand: "maestro",
		cliArgs: ["ralph", "check"],
		description: "cmd.ralph_check.desc",
		outputKind: "text",
		riskLevel: "read",
	},
	{
		id: "ralph-session",
		label: "cmd.ralph_session",
		category: "ralph",
		cliCommand: "maestro",
		cliArgs: ["ralph", "session"],
		description: "cmd.ralph_session.desc",
		outputKind: "text",
		riskLevel: "read",
	},

	// -- knowledge -----------------------------------------------------------
	{
		id: "knowledge-search",
		label: "cmd.knowledge_search",
		category: "knowledge",
		cliCommand: "maestro",
		cliArgs: ["search", "<query>"],
		description: "cmd.knowledge_search.desc",
		outputKind: "json",
		riskLevel: "read",
	},
	{
		id: "knowledge-load",
		label: "cmd.knowledge_load",
		category: "knowledge",
		cliCommand: "maestro",
		cliArgs: ["load", "--type", "<type>", "--category", "<category>"],
		description: "cmd.knowledge_load.desc",
		outputKind: "json",
		riskLevel: "read",
	},
] as const;
