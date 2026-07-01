import { electronTrpc } from "renderer/lib/electron-trpc";

/**
 * Wrapper around useOpenNew that matches the Superset useOpenProject() API.
 * Returns { openNew } for compatibility with NewWorkspaceModal.
 */
export function useOpenProject() {
	const openNewMutation = electronTrpc.projects.openNew.useMutation();
	return { openNew: openNewMutation.mutateAsync };
}
