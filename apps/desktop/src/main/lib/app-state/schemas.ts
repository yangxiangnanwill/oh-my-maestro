/**
 * UI state schemas (persisted from renderer zustand stores)
 */
// Phase 3 stub types — will be replaced by Phase 4 shared modules
interface BaseTabsState {
  tabs: unknown[];
  panes: Record<string, unknown>;
  activeTabIds: Record<string, string>;
  focusedPaneIds: Record<string, string>;
  tabHistoryStacks: Record<string, string[]>;
}

interface Pane {
  id: string;
  type: string;
}

type Theme = Record<string, unknown>;

// Re-export for convenience
export type { BaseTabsState as TabsState, Pane };

export interface ThemeState {
	activeThemeId: string;
	customThemes: Theme[];
	systemLightThemeId?: string;
	systemDarkThemeId?: string;
}

/** Legacy hotkeys state shape (kept for reading old app-state.json during migration) */
interface LegacyHotkeysState {
	version: number;
	byPlatform: Record<string, Record<string, string | null>>;
}

export interface AppState {
	tabsState: BaseTabsState;
	themeState: ThemeState;
	hotkeysState: LegacyHotkeysState;
}

export const defaultAppState: AppState = {
	tabsState: {
		tabs: [],
		panes: {},
		activeTabIds: {},
		focusedPaneIds: {},
		tabHistoryStacks: {},
	},
	themeState: {
		activeThemeId: "dark",
		customThemes: [],
		systemLightThemeId: "light",
		systemDarkThemeId: "dark",
	},
	hotkeysState: {
		version: 1,
		byPlatform: { darwin: {}, win32: {}, linux: {} },
	},
};
