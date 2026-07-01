/**
 * Minimal shared/themes module stub for terminal router.
 * Provides only what theme-type.ts needs.
 * Full theme system is a renderer concern and will be implemented in a later phase.
 */

export interface AppTheme {
	id: string;
	type: "dark" | "light";
	isBuiltIn?: boolean;
	isCustom?: boolean;
}

export type Theme = AppTheme;

export const DEFAULT_THEME_ID = "dark";

/**
 * Built-in themes used as fallback when custom themes don't match.
 * These provide the minimal data needed for terminal theme type resolution.
 * Full theme definitions (colors, tokens, etc.) are in the renderer layer.
 */
export const builtInThemes: AppTheme[] = [
	{ id: "dark", type: "dark", isBuiltIn: true, isCustom: false },
	{ id: "light", type: "light", isBuiltIn: true, isCustom: false },
	{ id: "system", type: "dark", isBuiltIn: true, isCustom: false },
];

/**
 * Gets terminal colors from a theme.
 * Stub: returns a minimal color map. Full implementation in renderer layer.
 */
export function getTerminalColors(_theme: AppTheme): Record<string, string> {
	return {
		background: "#1a1b26",
		foreground: "#a9b1d6",
		cursor: "#c0caf5",
		black: "#414868",
		red: "#f7768e",
		green: "#9ece6a",
		yellow: "#e0af68",
		blue: "#7aa2f7",
		magenta: "#bb9af7",
		cyan: "#7dcfff",
		white: "#a9b1d6",
		brightBlack: "#414868",
		brightRed: "#f7768e",
		brightGreen: "#9ece6a",
		brightYellow: "#e0af68",
		brightBlue: "#7aa2f7",
		brightMagenta: "#bb9af7",
		brightCyan: "#7dcfff",
		brightWhite: "#c0caf5",
	};
}
