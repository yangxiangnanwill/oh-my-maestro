/**
 * Agent launch request builder (shared/renderer-safe).
 *
 * Mapped from @superset/shared/agent-launch-request for oh-my-maestro.
 * Provides buildPromptAgentLaunchRequest used by the NewWorkspaceModal PromptGroup.
 */

import type { AgentLaunchRequest } from "./agent-launch";

export interface BuildPromptAgentLaunchRequestInput {
	workspaceId: string;
	source: string;
	selectedAgent: string;
	prompt: string;
	initialFiles?: Array<{ data: string; mediaType: string; filename?: string }>;
	taskSlug?: string;
	configsById?: Record<string, { label?: string }>;
}

/**
 * Builds a terminal-based AgentLaunchRequest from a user prompt.
 * Returns null if the selected agent is "none".
 */
export function buildPromptAgentLaunchRequest(
	input: BuildPromptAgentLaunchRequestInput,
): AgentLaunchRequest | null {
	if (input.selectedAgent === "none") return null;

	const config = input.configsById?.[input.selectedAgent];
	const agentLabel = config?.label ?? input.selectedAgent;

	return {
		kind: "terminal",
		workspaceId: input.workspaceId,
		source: "new-workspace-modal",
		agentType: input.selectedAgent,
		terminal: {
			command: agentLabel,
			name: agentLabel,
			autoExecute: true,
			taskPromptContent: input.prompt || undefined,
			...(input.initialFiles?.length
				? { initialFiles: input.initialFiles }
				: {}),
		},
	};
}
