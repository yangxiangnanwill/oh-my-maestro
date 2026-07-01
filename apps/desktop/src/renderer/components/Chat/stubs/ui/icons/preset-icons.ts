// Stub: @superset/ui/icons/preset-icons
// Claude icon as base64-encoded SVG data URL
export const claudeIcon =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' stroke='%23D97757' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

export interface PresetIconSet {
	light: string;
	dark: string;
}

export const PRESET_ICONS: Record<string, PresetIconSet> = {};

export function getPresetIcon(
	presetName: string,
	isDark: boolean,
): string | undefined {
	const icon = PRESET_ICONS[presetName];
	if (!icon) return undefined;
	return isDark ? icon.dark : icon.light;
}
