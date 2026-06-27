/**
 * Phase 4: GitHub integration stub for workspaces router.
 * Full implementation will be migrated from Superset in a later phase.
 */

import type { GitHubStatus, PullRequestComment } from "main/lib/local-db";
import type { RepoContext } from "./repo-context";

export interface PullRequestCommentsTarget {
	prNumber: number;
	repoContext: Pick<RepoContext, "repoUrl" | "upstreamUrl" | "isFork">;
}

export async function fetchGitHubPRStatus(
	_worktreePath: string,
	_branchName?: string | null,
): Promise<GitHubStatus | null> {
	return null;
}

export async function fetchGitHubPRComments(params: {
	worktreePath: string;
	pullRequest?: PullRequestCommentsTarget | null;
	branchName?: string | null;
}): Promise<PullRequestComment[]> {
	void params;
	return [];
}

export async function resolveReviewThread(params: {
	worktreePath: string;
	threadId: string;
	resolve: boolean;
}): Promise<void> {
	void params;
	// Phase 4 stub
}

export function clearGitHubCachesForWorktree(_worktreePath: string): void {
	// Phase 4 stub
}
