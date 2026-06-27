/**
 * Stub for @superset/shared/workspace-launch (Phase 4).
 * Provides branch name and workspace title utilities.
 * Full implementation migrated from Superset.
 */

/**
 * Sanitizes an author name for use as a branch prefix.
 * Converts to lowercase, replaces whitespace and special chars with dashes.
 */
export function sanitizeAuthorPrefix(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[\s@+]+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/--+/g, "-")
		.replace(/^-+|-+$/g, "");
}
export function sanitizeBranchName(
  name: string,
  options?: { preserveFirstSegmentCase?: boolean },
): string {
  let sanitized = name
    .replace(/[^a-zA-Z0-9._/-]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/\/{2,}/g, "/")
    .replace(/^[./-]+|[./-]+$/g, "")
    .replace(/@{/g, "-{");

  if (options?.preserveFirstSegmentCase) {
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

/**
 * Sanitizes a branch name and limits it to a maximum length.
 */
export function sanitizeBranchNameWithMaxLength(
  name: string,
  maxLength?: number,
  options?: { preserveFirstSegmentCase?: boolean },
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
 * Deduplicates a branch name by appending a counter if it conflicts with existing branches.
 */
export function deduplicateBranchName(
  branch: string,
  existingBranches: string[],
): string {
  const existingSet = new Set(existingBranches.map((b) => b.toLowerCase()));
  if (!existingSet.has(branch.toLowerCase())) {
    return branch;
  }

  let counter = 2;
  let candidate = `${branch}-${counter}`;
  while (existingSet.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${branch}-${counter}`;
  }
  return candidate;
}

/**
 * Derives a workspace title from a user prompt by extracting the first meaningful phrase.
 */
export function deriveWorkspaceTitleFromPrompt(prompt: string): string | null {
  const cleaned = prompt.trim();
  if (!cleaned) return null;

  // Take first sentence or first 50 chars, whichever is shorter
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  const title = firstSentence.length > 50
    ? firstSentence.slice(0, 47) + "..."
    : firstSentence;

  return title || null;
}
