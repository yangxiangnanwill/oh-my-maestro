/**
 * Command Definition types for the typed Command Registry.
 *
 * These types define the structure of Maestro CLI commands as exposed
 * through the tRPC commands.list procedure. Only riskLevel="read"
 * commands are included in the MVP registry.
 */

// ---------------------------------------------------------------------------
// Single source of truth for category / output / risk enums
// ---------------------------------------------------------------------------

/** All valid command categories — single source of truth */
export const COMMAND_CATEGORIES = [
	"workflow",
	"ralph",
	"knowledge",
	"project",
	"debug",
	"config",
	"system",
] as const;

/** All valid output kinds */
export const OUTPUT_KINDS = [
	"text",
	"json",
	"state",
	"table",
	"stream",
] as const;

/** All valid risk levels */
export const RISK_LEVELS = ["read", "write", "destructive"] as const;

// ---------------------------------------------------------------------------
// Derived types (from const arrays — single source of truth)
// ---------------------------------------------------------------------------

export type CommandCategory = (typeof COMMAND_CATEGORIES)[number];
export type OutputKind = (typeof OUTPUT_KINDS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

// ---------------------------------------------------------------------------
// CommandDefinition
// ---------------------------------------------------------------------------

export interface CommandDefinition {
	/** Unique kebab-case identifier, e.g. "knowledge-search" */
	id: string;
	/** Human-readable name, e.g. "知识搜索" */
	label: string;
	/** Category for grouping in the UI */
	category: CommandCategory;
	/** Actual CLI binary name, e.g. "maestro" */
	cliCommand: string;
	/** Template args appended after cliCommand, e.g. ["search", "<query>"] */
	cliArgs: string[];
	/** Short description shown in the command palette */
	description: string;
	/** Expected output format */
	outputKind: OutputKind;
	/** Risk classification — only "read" commands are exposed in MVP */
	riskLevel: RiskLevel;
	/** Optional notes or caveats */
	notes?: string;
}
