/**
 * Phase 4: GitHub PR resolution stub.
 */

import type { GitHubStatus } from "main/lib/local-db";

export async function getPRForBranch(
	_worktreePath: string,
	_localBranch: string,
	_repoContext?: unknown,
	_headSha?: string,
): Promise<GitHubStatus["pr"]> {
	return null;
}
