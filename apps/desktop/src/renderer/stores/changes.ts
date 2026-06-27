// Phase 4: Changes store (migrated from Superset)
// zustand store tracking diff viewer settings across the workspace view.

import { create } from "zustand";

interface ChangesState {
  hideUnchangedRegions: boolean;
  toggleHideUnchangedRegions: () => void;
}

export const useChangesStore = create<ChangesState>((set) => ({
  hideUnchangedRegions: true,
  toggleHideUnchangedRegions: () =>
    set((state) => ({ hideUnchangedRegions: !state.hideUnchangedRegions })),
}));
