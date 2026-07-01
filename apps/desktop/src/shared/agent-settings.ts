// Phase 4: Agent settings types and functions (migrated from Superset @superset/shared/agent-settings)

import type {
	AgentCustomDefinition,
	AgentPresetOverrideEnvelope,
	PromptTransport,
} from "main/lib/local-db";

export type AgentDefinitionId = string;

export interface AgentPresetPatch {
	enabled?: boolean;
	label?: string;
	description?: string | null;
	command?: string;
	promptCommand?: string;
	promptCommandSuffix?: string | null;
	taskPromptTemplate?: string;
	model?: string | null;
}

export interface CustomAgentDefinitionPatch {
	enabled?: boolean;
	label?: string;
	description?: string | null;
	command?: string;
	promptCommand?: string | null;
	promptCommandSuffix?: string | null;
	promptTransport?: PromptTransport | null;
	taskPromptTemplate?: string;
}

export interface AgentDefinition {
	id: AgentDefinitionId;
	source: "builtin" | "user";
	kind: "terminal" | "chat";
	label: string;
	description?: string | null;
	command?: string;
	promptCommand?: string;
	promptCommandSuffix?: string | null;
	taskPromptTemplate?: string;
	enabled?: boolean;
	model?: string | null;
}

const KNOWN_TASK_PROMPT_VARIABLES = ["prompt", "command", "cwd", "projectName"];

export function validateTaskPromptTemplate(template: string): {
	valid: boolean;
	unknownVariables: string[];
} {
	const varPattern = /\{\{(\w+)\}\}/g;
	const unknownVariables: string[] = [];
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
	while ((match = varPattern.exec(template)) !== null) {
		const varName = match[1];
		if (!KNOWN_TASK_PROMPT_VARIABLES.includes(varName)) {
			unknownVariables.push(varName);
		}
	}

	return {
		valid: unknownVariables.length === 0,
		unknownVariables,
	};
}

export function readAgentPresetOverrides(
	overrides: AgentPresetOverrideEnvelope | undefined | null,
): AgentPresetOverrideEnvelope {
	return overrides ?? { overrides: {} };
}

export function getAgentDefinitionById({
	customDefinitions,
	id,
}: {
	customDefinitions: AgentCustomDefinition[];
	id: AgentDefinitionId;
}): AgentDefinition | undefined {
	return undefined;
}

export function getCustomAgentDefinitionById({
	customDefinitions,
	id,
}: {
	customDefinitions: AgentCustomDefinition[];
	id: `custom:${string}`;
}): AgentCustomDefinition | undefined {
	return customDefinitions.find((d) => d.id === id);
}

export function upsertCustomAgentDefinition({
	currentDefinitions,
	definition,
}: {
	currentDefinitions: AgentCustomDefinition[];
	definition: AgentCustomDefinition;
}): AgentCustomDefinition[] {
	const idx = currentDefinitions.findIndex((d) => d.id === definition.id);
	if (idx >= 0) {
		const next = [...currentDefinitions];
		next[idx] = definition;
		return next;
	}
	return [...currentDefinitions, definition];
}

export function deleteCustomAgentDefinition({
	currentDefinitions,
	id,
}: {
	currentDefinitions: AgentCustomDefinition[];
	id: `custom:${string}`;
}): AgentCustomDefinition[] {
	return currentDefinitions.filter((d) => d.id !== id);
}

export function applyCustomAgentDefinitionPatch({
	definition,
	patch,
}: {
	definition: AgentCustomDefinition;
	patch: CustomAgentDefinitionPatch;
}): AgentCustomDefinition {
	const result = { ...definition, ...patch } as AgentCustomDefinition;
	if (result.promptTransport === null) {
		delete result.promptTransport;
	}
	if (result.description === null) {
		result.description = undefined;
	}
	return result;
}

export function createOverrideEnvelopeWithPatch({
	definition,
	currentOverrides,
	id,
	patch,
}: {
	definition: AgentDefinition;
	currentOverrides: AgentPresetOverrideEnvelope;
	id: AgentDefinitionId;
	patch: AgentPresetPatch;
}): AgentPresetOverrideEnvelope {
	return {
		...currentOverrides,
		overrides: {
			...currentOverrides.overrides,
			[id]: {
				...((currentOverrides.overrides?.[id] as Record<string, unknown>) ??
					{}),
				...patch,
			},
		},
	};
}

export function resetAgentPresetOverride({
	currentOverrides,
	id,
}: {
	currentOverrides: AgentPresetOverrideEnvelope;
	id: AgentDefinitionId;
}): AgentPresetOverrideEnvelope {
	const next = { ...currentOverrides.overrides };
	delete next[id];
	return { ...currentOverrides, overrides: next };
}

export function resetAllAgentPresetOverrides(): AgentPresetOverrideEnvelope {
	return { overrides: {} };
}

export function resolveAgentConfigs({
	customDefinitions,
	overrideEnvelope,
}: {
	customDefinitions: AgentCustomDefinition[];
	overrideEnvelope: AgentPresetOverrideEnvelope;
}): AgentDefinition[] {
	return customDefinitions.map((d) => ({
		id: d.id,
		source: "user" as const,
		kind: d.kind,
		label: d.label,
		description: d.description,
		command: d.command,
		promptCommand: d.promptCommand,
		promptCommandSuffix: d.promptCommandSuffix,
		taskPromptTemplate: d.taskPromptTemplate,
		enabled: d.enabled,
	}));
}

/**
 * Filters agent definitions to only those that are enabled.
 */
export function getEnabledAgentConfigs<T extends { enabled?: boolean }>(
	definitions: T[],
): T[] {
	return definitions.filter((d) => d.enabled !== false);
}

/**
 * Indexes resolved agent configs by id for O(1) lookup.
 */
export function indexResolvedAgentConfigs<T extends { id: string }>(
	definitions: T[],
): Record<string, T> {
	const index: Record<string, T> = {};
	for (const def of definitions) {
		index[def.id] = def;
	}
	return index;
}
