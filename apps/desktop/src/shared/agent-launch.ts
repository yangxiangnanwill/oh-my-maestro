/**
 * Agent launch types and utilities.
 *
 * Mapped from @superset/shared/agent-launch for oh-my-maestro.
 * Contains the minimal types needed by agent-session-orchestrator.
 */

export type AgentLaunchSource =
	| "command-watcher"
	| "preset"
	| "new-workspace-modal"
	| "workspace-init"
	| "agent-panel"
	| "unknown";

export interface TerminalLaunchPayload {
	command: string;
	name?: string;
	paneId?: string;
	autoExecute?: boolean;
	taskPromptFileName?: string;
	taskPromptContent?: string;
	initialFiles?: Array<{ data: string; mediaType: string; filename?: string }>;
}

export interface ChatLaunchPayload {
	paneId?: string;
	sessionId?: string;
	initialPrompt?: string;
	model?: string;
	retryCount?: number;
	autoExecute?: boolean;
	taskSlug?: string;
	initialFiles?: Array<{ data: string; mediaType: string; filename?: string }>;
}

export interface TerminalLaunchRequest {
	kind: "terminal";
	workspaceId: string;
	idempotencyKey?: string;
	source?: AgentLaunchSource;
	agentType?: string;
	terminal: TerminalLaunchPayload;
}

export interface ChatLaunchRequest {
	kind: "chat";
	workspaceId: string;
	idempotencyKey?: string;
	source?: AgentLaunchSource;
	agentType?: string;
	chat: ChatLaunchPayload;
}

export type AgentLaunchRequest = TerminalLaunchRequest | ChatLaunchRequest;

export interface AgentLaunchResult {
	workspaceId: string;
	tabId: string | null;
	paneId: string | null;
	sessionId: string | null;
	status: "queued" | "launching" | "running" | "failed";
	error: string | null;
}

/**
 * Normalize an AgentLaunchRequest from unknown input.
 * Ensures required fields have defaults.
 */
export function normalizeAgentLaunchRequest(
	input: AgentLaunchRequest | unknown,
): AgentLaunchRequest {
	if (typeof input !== "object" || input === null) {
		throw new Error("Invalid agent launch request: expected an object");
	}

	const req = input as Record<string, unknown>;

	if (req.kind !== "terminal" && req.kind !== "chat") {
		throw new Error(
			`Invalid agent launch request kind: ${String(req.kind)}`,
		);
	}

	if (typeof req.workspaceId !== "string" || !req.workspaceId) {
		throw new Error("Invalid agent launch request: missing workspaceId");
	}

	const kind = req.kind as "terminal" | "chat";

	if (kind === "terminal") {
		const terminal: TerminalLaunchPayload =
			(req.terminal as TerminalLaunchPayload) ?? { command: "" };
		return {
			kind: "terminal",
			workspaceId: req.workspaceId as string,
			idempotencyKey:
				typeof req.idempotencyKey === "string"
					? req.idempotencyKey
					: undefined,
			source:
				typeof req.source === "string"
					? (req.source as AgentLaunchSource)
					: undefined,
			agentType:
				typeof req.agentType === "string" ? req.agentType : undefined,
			terminal,
		} satisfies TerminalLaunchRequest;
	}

	if (kind === "chat") {
		const chat: ChatLaunchPayload =
			(req.chat as ChatLaunchPayload) ?? {};
		return {
			kind: "chat",
			workspaceId: req.workspaceId as string,
			idempotencyKey:
				typeof req.idempotencyKey === "string"
					? req.idempotencyKey
					: undefined,
			source:
				typeof req.source === "string"
					? (req.source as AgentLaunchSource)
					: undefined,
			agentType:
				typeof req.agentType === "string" ? req.agentType : undefined,
			chat,
		} satisfies ChatLaunchRequest;
	}

	throw new Error(`Unreachable kind: ${kind}`);
}
