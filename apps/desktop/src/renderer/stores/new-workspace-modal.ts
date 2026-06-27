// Stub: renderer/stores/new-workspace-modal
// Provides hooks for the NewWorkspaceModal component.
// Full implementation will be migrated from Superset in a later phase.

import { useCallback, useSyncExternalStore } from "react";
import { create } from "zustand";

// --- Zustand store for command palette integration ---

interface NewWorkspaceModalStore {
	openModal: (projectId?: string) => void;
}

export const useNewWorkspaceModalStore = create<NewWorkspaceModalStore>(() => ({
	openModal: (_projectId) => {
		// Stub: no-op until modal integration is complete
	},
}));

// --- Modal open state ---

let isModalOpen = false;
const modalListeners = new Set<() => void>();

function subscribeModal(callback: () => void): () => void {
  modalListeners.add(callback);
  return () => modalListeners.delete(callback);
}

function getModalSnapshot(): boolean {
  return isModalOpen;
}

export function useNewWorkspaceModalOpen(): boolean {
  return useSyncExternalStore(subscribeModal, getModalSnapshot);
}

export function useCloseNewWorkspaceModal(): () => void {
  return useCallback(() => {
    isModalOpen = false;
    for (const listener of modalListeners) listener();
  }, []);
}

// --- Pre-selected project ---

let preSelectedProjectId: string | null = null;
const preSelectListeners = new Set<() => void>();

function subscribePreSelect(callback: () => void): () => void {
  preSelectListeners.add(callback);
  return () => preSelectListeners.delete(callback);
}

function getPreSelectSnapshot(): string | null {
  return preSelectedProjectId;
}

export function usePreSelectedProjectId(): string | null {
  return useSyncExternalStore(subscribePreSelect, getPreSelectSnapshot);
}

// --- Pending workspace ---

interface PendingWorkspace {
  id: string;
  projectId: string;
  name: string;
  status: string;
}

let pendingWorkspace: PendingWorkspace | null = null;
const pendingListeners = new Set<() => void>();

function subscribePending(callback: () => void): () => void {
  pendingListeners.add(callback);
  return () => pendingListeners.delete(callback);
}

function getPendingSnapshot(): PendingWorkspace | null {
  return pendingWorkspace;
}

export function useSetPendingWorkspace(): (ws: PendingWorkspace) => void {
  return useCallback((ws: PendingWorkspace) => {
    pendingWorkspace = ws;
    for (const listener of pendingListeners) listener();
  }, []);
}

export function useSetPendingWorkspaceStatus(): (id: string, status: string) => void {
  return useCallback((id: string, status: string) => {
    if (pendingWorkspace && pendingWorkspace.id === id) {
      pendingWorkspace = { ...pendingWorkspace, status };
      for (const listener of pendingListeners) listener();
    }
  }, []);
}

export function useClearPendingWorkspace(): (id: string) => void {
  return useCallback((id: string) => {
    if (pendingWorkspace && pendingWorkspace.id === id) {
      pendingWorkspace = null;
      for (const listener of pendingListeners) listener();
    }
  }, []);
}
