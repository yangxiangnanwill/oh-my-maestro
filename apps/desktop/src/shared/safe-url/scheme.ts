/**
 * Safe external URL helpers (shared layer).
 *
 * Extracted from main/lib/safe-url/scheme.ts so renderer code can import these
 * without pulling in main-process modules. The original main/lib/safe-url/scheme.ts
 * is kept as a re-export shim for backward compatibility (preserves the
 * `from "./scheme"` import chain used by safe-url.test.ts and safe-url.ts).
 */

/**
 * Schemes safe to hand to Electron's `shell.openExternal`.
 * Anything else (file:, javascript:, custom handlers, etc.) can execute
 * binaries or scripts via the OS URL handler registry.
 */
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

export function isSafeExternalUrl(url: string): boolean {
	if (typeof url !== "string" || url.length === 0) return false;
	try {
		return ALLOWED_SCHEMES.has(new URL(url).protocol);
	} catch {
		return false;
	}
}

export function externalUrlLogLabel(url: string): string {
	if (typeof url !== "string" || url.length === 0) return "empty";
	try {
		return new URL(url).protocol || "unknown:";
	} catch {
		return "malformed";
	}
}
