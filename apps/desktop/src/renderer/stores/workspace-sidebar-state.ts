// Stub: renderer/stores/workspace-sidebar-state
// Provides workspace sidebar open/close state.
// Full implementation will be migrated from Superset in a later phase.

import { create } from "zustand";

interface WorkspaceSidebarState {
	open: boolean;
	toggleOpen: () => void;
}

export const useWorkspaceSidebarStore = create<WorkspaceSidebarState>((set) => ({
	open: true,
	toggleOpen: () => set((s) => ({ open: !s.open })),
}));
