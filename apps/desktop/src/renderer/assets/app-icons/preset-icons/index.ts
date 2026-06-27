import { getPresetIcon, PRESET_ICONS } from "@superset/ui/icons/preset-icons";
import { useThemeStore } from "renderer/stores/theme/store";

export { PRESET_ICONS, getPresetIcon };
export type { PresetIconSet } from "@superset/ui/icons/preset-icons";

export function usePresetIcon(presetName: string): string | undefined {
	const activeThemeId = useThemeStore((state) => state.activeThemeId);
	const isDark = activeThemeId !== "light";
	return getPresetIcon(presetName, isDark);
}

export function useIsDarkTheme(): boolean {
	const activeThemeId = useThemeStore((state) => state.activeThemeId);
	return activeThemeId !== "light";
}
