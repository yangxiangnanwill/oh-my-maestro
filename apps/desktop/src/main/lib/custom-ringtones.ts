// Phase 4: Custom ringtone management (migrated from Superset main/lib/custom-ringtones)

export interface CustomRingtoneInfo {
	exists: boolean;
	filename?: string;
	originalName?: string;
}

export function hasCustomRingtone(): boolean {
	return false;
}

export function getCustomRingtonePath(): string | null {
	return null;
}

export function getCustomRingtoneInfo(): CustomRingtoneInfo {
	return { exists: false };
}

export async function importCustomRingtoneFromPath(
	_sourcePath: string,
): Promise<CustomRingtoneInfo> {
	return { exists: false };
}
