// Stub: renderer/stores/right-sidebar-toggle-intent
// Provides intent store for toggling the right sidebar.
// Full implementation will be migrated from Superset in a later phase.

import { create } from "zustand";

interface RightSidebarToggleIntentState {
	request: () => void;
}

export const useRightSidebarToggleIntent =
	create<RightSidebarToggleIntentState>(() => ({
		request: () => {
			// Stub: no-op until sidebar system is integrated
		},
	}));
