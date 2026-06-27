// ============================================================
// Phase 4: Changes types (migrated from Superset shared/changes-types)
// ============================================================

export type FileStatus =
	| "added"
	| "deleted"
	| "modified"
	| "renamed"
	| "copied"
	| "untracked";

export interface ChangedFile {
	path: string;
	oldPath?: string;
	status: FileStatus;
	additions: number;
	deletions: number;
}

export interface CommitInfo {
	hash: string;
	shortHash: string;
	message: string;
	author: string;
	date: Date;
	files: ChangedFile[];
}

export interface GitChangesStatus {
	branch: string;
	defaultBranch: string;
	againstBase: ChangedFile[];
	commits: CommitInfo[];
	staged: ChangedFile[];
	unstaged: ChangedFile[];
	untracked: ChangedFile[];
	ahead: number;
	behind: number;
	pushCount: number;
	pullCount: number;
	hasUpstream: boolean;
}

export interface FileContents {
	original: string;
	modified: string;
	language: string;
}

export type ChangeCategory = "against-base" | "committed" | "staged" | "unstaged";
