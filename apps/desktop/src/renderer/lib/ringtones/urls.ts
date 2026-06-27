/**
 * Vite-bundled URLs for each built-in ringtone .mp3. Keyed by the filenames
 * declared in `shared/ringtones.ts`. Using `new URL(..., import.meta.url)`
 * lets Vite emit hashed asset URLs in prod and serve the files in dev
 * without copying them into `resources/public/`.
 */
export const builtInRingtoneUrls: Record<string, string> = {
	"default.mp3": new URL(
		"../../../resources/sounds/default.mp3",
		import.meta.url,
	).href,
	"chime.mp3": new URL("../../../resources/sounds/chime.mp3", import.meta.url)
		.href,
	"bell.mp3": new URL("../../../resources/sounds/bell.mp3", import.meta.url)
		.href,
	"ping.mp3": new URL("../../../resources/sounds/ping.mp3", import.meta.url)
		.href,
	"pop.mp3": new URL("../../../resources/sounds/pop.mp3", import.meta.url).href,
	"note.mp3": new URL("../../../resources/sounds/note.mp3", import.meta.url)
		.href,
};
