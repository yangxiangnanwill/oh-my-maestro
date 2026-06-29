/**
 * Command Definition types for the typed Command Registry.
 *
 * These types define the structure of Maestro CLI commands as exposed
 * through the tRPC commands.list procedure. Only riskLevel="read"
 * commands are included in the MVP registry.
 */

// ---------------------------------------------------------------------------
// Category & classification types
// ---------------------------------------------------------------------------

export type CommandCategory =
  | "workflow"
  | "ralph"
  | "knowledge"
  | "project"
  | "debug"
  | "config"
  | "system";

export type OutputKind = "text" | "json" | "state" | "table" | "stream";

export type RiskLevel = "read" | "write" | "destructive";

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
