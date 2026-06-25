// Phase 3 stub — will be replaced by Phase 4 implementation
// Original depends on @superset/local-db, shared/env.shared, shared/worktree-id

export function resolveDevWorkspaceName(
	_cwd = process.cwd(),
): string | undefined {
	if (process.env.NODE_ENV !== "development") return undefined;
	// TODO: Phase 4 — implement with @superset/local-db and shared modules
	return undefined;
}
