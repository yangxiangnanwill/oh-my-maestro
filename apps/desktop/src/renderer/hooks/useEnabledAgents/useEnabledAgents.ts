// TODO: Phase 5 — useEnabledAgents
// This hook depends on @superset/shared/agent-settings (getEnabledAgentConfigs,
// ResolvedAgentConfig) which will be migrated in a later phase.
// For now, this is a stub that returns the raw agent presets from settings.

import { electronTrpc } from "renderer/lib/electron-trpc";

interface UseEnabledAgentsResult {
	agents: unknown[];
	isPending: boolean;
	isFetched: boolean;
}

/** Fetches agent presets from the desktop settings IPC and returns only the
 * enabled ones. Shared across the automations and new-workspace flows. */
export function useEnabledAgents(): UseEnabledAgentsResult {
	const query = electronTrpc.settings.getAgentPresets.useQuery();

	// TODO: Filter enabled agents using getEnabledAgentConfigs when
	// @superset/shared/agent-settings is migrated
	const agents = query.data ?? [];

	return { agents, isPending: query.isPending, isFetched: query.isFetched };
}
