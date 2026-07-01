// Stub: toErrorMessage for @superset/workspace-fs/host
// Full implementation will be added in a later phase.

export function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
