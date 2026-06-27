/**
 * Workspace launch utilities (shared/renderer-safe).
 *
 * Mapped from @superset/shared/workspace-launch for oh-my-maestro.
 * The main-process version lives in main/lib/workspace-launch.ts.
 */

/**
 * Sanitizes a branch name and limits it to a maximum length.
 */
export function sanitizeBranchNameWithMaxLength(
	name: string,
	maxLength?: number,
	options?: { preserveCase?: boolean },
): string {
	const sanitized = sanitizeBranchName(name, options);
	const limit = maxLength ?? 244;
	if (sanitized.length <= limit) return sanitized;

	// Truncate intelligently at word boundaries
	const truncated = sanitized.slice(0, limit);
	const lastDash = truncated.lastIndexOf("-");
	if (lastDash > limit * 0.7) {
		return truncated.slice(0, lastDash);
	}
	return truncated;
}

/**
 * Sanitizes a branch name for git compatibility.
 */
export function sanitizeBranchName(
	name: string,
	options?: { preserveCase?: boolean },
): string {
	let sanitized = name
		.replace(/[^a-zA-Z0-9._/-]/g, "-")
		.replace(/\.{2,}/g, ".")
		.replace(/\/{2,}/g, "/")
		.replace(/^[./-]+|[./-]+$/g, "")
		.replace(/@{/g, "-{");

	if (options?.preserveCase) {
		const slashIndex = sanitized.indexOf("/");
		if (slashIndex > 0) {
			sanitized =
				sanitized.slice(0, slashIndex) +
				sanitized.slice(slashIndex).toLowerCase();
		}
	} else {
		sanitized = sanitized.toLowerCase();
	}

	return sanitized;
}
