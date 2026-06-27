import type { ExecutionMode, TerminalPreset } from "main/lib/local-db";

/**
 * Normalizes an execution mode value to a valid ExecutionMode.
 * Maps legacy "parallel" to "split-pane" and unknown/missing values to "new-tab".
 */
export function normalizeExecutionMode(mode: unknown): ExecutionMode {
	if (mode === "new-tab") return "new-tab";
	if (mode === "new-tab-split-pane") return "new-tab-split-pane";
	if (mode === "split-pane") return "split-pane";
	if (mode === "sequential") return "sequential";
	if (mode === "parallel") return "split-pane";
	return "new-tab";
}

export type { TerminalPreset };
