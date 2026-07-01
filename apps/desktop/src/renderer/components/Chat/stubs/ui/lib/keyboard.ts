// Stub: @superset/ui/lib/keyboard
// Provides keyboard utility functions.

interface IsEnterSubmitOptions {
	requireMod?: boolean;
}

export function isEnterSubmit(
	e: KeyboardEvent,
	options?: IsEnterSubmitOptions,
): boolean {
	if (e.key !== "Enter") return false;
	if (options?.requireMod) {
		return e.metaKey || e.ctrlKey;
	}
	return !e.shiftKey;
}
