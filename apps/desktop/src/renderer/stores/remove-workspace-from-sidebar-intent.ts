// Stub: renderer/stores/remove-workspace-from-sidebar-intent
// Provides intent store for removing workspace from sidebar.
// Full implementation will be migrated from Superset in a later phase.

import { create } from "zustand";

interface RemoveFromSidebarRequest {
	workspaceId: string;
	workspaceName: string;
	projectId: string;
	isMain: boolean;
}

interface RemoveFromSidebarIntentState {
	request: (req: RemoveFromSidebarRequest) => void;
}

export const useRemoveFromSidebarIntent = create<RemoveFromSidebarIntentState>(
	() => ({
		request: (_req) => {
			// Stub: no-op until sidebar management is integrated
		},
	}),
);
