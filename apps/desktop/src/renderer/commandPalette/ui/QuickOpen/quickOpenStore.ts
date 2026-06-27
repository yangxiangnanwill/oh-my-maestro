// Phase 5: quickOpenStore stub — migrated from Superset commandPalette/ui/QuickOpen
//
// The full QuickOpen UI is excluded from the Wave 6 framework migration.
// This store stub provides the minimal interface needed by modules/workspace/commands.tsx.

import { create } from "zustand";

interface QuickOpenTarget {
	workspaceId: string;
}

interface QuickOpenState {
	open: boolean;
	target: QuickOpenTarget | null;
	openFor: (target: QuickOpenTarget) => void;
	close: () => void;
}

export const useQuickOpenStore = create<QuickOpenState>((set) => ({
	open: false,
	target: null,
	openFor: (target) => set({ open: true, target }),
	close: () => set({ open: false }),
}));
