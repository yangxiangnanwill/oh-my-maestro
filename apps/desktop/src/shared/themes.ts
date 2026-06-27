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
