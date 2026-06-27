/**
 * Phase 4: Workspace init types (migrated from Superset shared/types/workspace-init).
 */

export type WorkspaceInitStep =
	| "syncing"
	| "verifying"
	| "fetching"
	| "creating_worktree"
	| "copying_config"
	| "finalizing"
	| "ready"
	| "failed";

export interface WorkspaceInitProgress {
	workspaceId: string;
	step: WorkspaceInitStep;
	message: string;
	warning?: string;
	error?: string;
}
