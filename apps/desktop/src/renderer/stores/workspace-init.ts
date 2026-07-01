// Phase 4: Workspace init store (migrated from Superset)
// zustand store managing pending terminal setup during workspace creation.

import { create } from "zustand";
import type { AgentLaunchRequest } from "shared/agent-launch";

export interface PendingTerminalSetup {
	workspaceId: string;
	projectId: string;
	initialCommands: string[] | null;
	defaultPresets?: string[];
	agentCommand?: string;
	agentLaunchRequest?: AgentLaunchRequest;
}

interface WorkspaceInitState {
	pendingTerminalSetups: Record<string, PendingTerminalSetup>;
	addPendingTerminalSetup: (setup: PendingTerminalSetup) => void;
	removePendingTerminalSetup: (workspaceId: string) => void;
	updateProgress: (progress: {
		workspaceId: string;
		projectId: string;
		step: string;
		message: string;
		warning?: string;
		error?: string;
	}) => void;
}

export const useWorkspaceInitStore = create<WorkspaceInitState>((set) => ({
	pendingTerminalSetups: {},
	addPendingTerminalSetup: (setup) =>
		set((state) => ({
			pendingTerminalSetups: {
				...state.pendingTerminalSetups,
				[setup.workspaceId]: setup,
			},
		})),
	removePendingTerminalSetup: (workspaceId) =>
		set((state) => {
			const next = { ...state.pendingTerminalSetups };
			delete next[workspaceId];
			return { pendingTerminalSetups: next };
		}),
	updateProgress: (_progress) => {
		// Stub: progress tracking is a no-op until full workspace-init manager is integrated
	},
}));
