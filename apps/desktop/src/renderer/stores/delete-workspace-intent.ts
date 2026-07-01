// Stub: renderer/stores/delete-workspace-intent
// Provides intent store for workspace deletion.
// Full implementation will be migrated from Superset in a later phase.

import { create } from "zustand";

interface DeleteWorkspaceRequest {
	workspaceId: string;
	workspaceName: string;
}

interface DeleteWorkspaceIntentState {
	request: (req: DeleteWorkspaceRequest) => void;
}

export const useDeleteWorkspaceIntent = create<DeleteWorkspaceIntentState>(
	() => ({
		request: (_req) => {
			// Stub: no-op until workspace deletion is integrated
		},
	}),
);
