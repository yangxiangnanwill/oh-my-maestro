// Phase 4 stub: shared/file-types
// Migrated from Superset file type utilities

const MIME_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
};

export function getImageMimeType(filePath: string): string | null {
	const ext = filePath.split(".").pop()?.toLowerCase();
	if (!ext) return null;
	return MIME_TYPES[ext] ?? null;
}
