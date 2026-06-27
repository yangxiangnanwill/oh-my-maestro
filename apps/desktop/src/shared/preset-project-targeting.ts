// Phase 4: Preset project targeting (migrated from Superset @superset/shared)

import type { TerminalPreset } from "main/lib/local-db";

/**
 * Filters presets to those matching the given project ID or all-project presets.
 */
export function filterMatchingPresetsForProject(
	presets: readonly TerminalPreset[],
	projectId?: string | null,
): TerminalPreset[] {
	if (!projectId) {
		return [...presets];
	}
	return presets.filter(
		(preset) =>
			!preset.projectIds ||
			preset.projectIds.length === 0 ||
			preset.projectIds.includes(projectId),
	);
}

/**
 * Returns true if the preset has specific project targeting.
 */
export function isProjectTargetedPreset(preset: TerminalPreset): boolean {
	return Array.isArray(preset.projectIds) && preset.projectIds.length > 0;
}

/**
 * Normalizes project IDs: deduplicates, trims whitespace, filters empty strings.
 * Returns null for empty/undefined input.
 */
export function normalizePresetProjectIds(
	projectIds: string[] | null | undefined,
): string[] | null {
	if (!projectIds || projectIds.length === 0) {
		return null;
	}
	const normalized = [
		...new Set(
			projectIds
				.map((id) => id.trim())
				.filter((id) => id.length > 0),
		),
	];
	return normalized.length > 0 ? normalized : null;
}
