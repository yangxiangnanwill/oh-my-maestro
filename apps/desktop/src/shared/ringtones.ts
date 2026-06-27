// Phase 4: Ringtone constants (migrated from Superset @superset/shared)

export const DEFAULT_RINGTONE_ID = "default";
export const CUSTOM_RINGTONE_ID = "custom";

const BUILT_IN_RINGTONE_IDS = [
	DEFAULT_RINGTONE_ID,
	"chime",
	"bell",
	"ping",
	"pop",
	"note",
] as const;

export type BuiltInRingtoneId = (typeof BUILT_IN_RINGTONE_IDS)[number];

export function isBuiltInRingtoneId(id: string): id is BuiltInRingtoneId {
	return BUILT_IN_RINGTONE_IDS.includes(id as BuiltInRingtoneId);
}

export function getRingtoneFilename(ringtoneId: string): string | null {
	const filenames: Record<string, string> = {
		default: "default.mp3",
		chime: "chime.mp3",
		bell: "bell.mp3",
		ping: "ping.mp3",
		pop: "pop.mp3",
		note: "note.mp3",
	};
	return filenames[ringtoneId] ?? null;
}
