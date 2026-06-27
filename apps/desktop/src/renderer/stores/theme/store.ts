// Stub: renderer/stores/theme/store
// Provides theme store used by command palette actions and ThemedToaster.
// Full implementation will be migrated from Superset in a later phase.

import { create } from "zustand";

export const SYSTEM_THEME_ID = "system";

interface ThemeState {
	activeThemeId: string;
	setTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
	activeThemeId: "dark",
	setTheme: (id) => set({ activeThemeId: id }),
}));

// Legacy useTheme hook used by ThemedToaster — returns { type: "light" | "dark" }
export function useTheme(): { type: "light" | "dark" } {
	const activeThemeId = useThemeStore((s) => s.activeThemeId);
	if (activeThemeId === "light") return { type: "light" };
	return { type: "dark" };
}
