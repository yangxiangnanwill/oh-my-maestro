/**
 * Command Registry — typed command definitions and read-only whitelist.
 *
 * This module provides the COMMAND_REGISTRY constant used by the tRPC
 * commands.list procedure to serve command metadata to the UI.
 */

export { COMMAND_REGISTRY } from "./registry";
export {
	COMMAND_CATEGORIES,
	OUTPUT_KINDS,
	RISK_LEVELS,
} from "./types";
export type {
	CommandCategory,
	CommandDefinition,
	OutputKind,
	RiskLevel,
} from "./types";
