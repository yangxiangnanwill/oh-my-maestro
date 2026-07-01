/**
 * Type stubs for @superset/workspace-client types used by host-service hooks.
 *
 * These types are used by useWorkspaceEvent, useGitStatus, useFileTree,
 * and useSendToTerminalAgent hooks. The actual workspace-client package
 * provides tRPC React hooks for communicating with the host-service process.
 *
 * Phase 5: Replace with actual workspace-client package when integrated.
 */

import type { FsEntry } from "./workspace-fs-types";

/** Payload for git:changed events emitted by the host-service event bus. */
export interface GitChangedPayload {
	paths?: string[];
}

/** Payload for agent:lifecycle events. */
export interface AgentLifecyclePayload {
	terminalId: string;
	agentId: string;
	kind: "started" | "stopped" | "error";
	error?: string;
}

/** Payload for terminal:lifecycle events. */
export interface TerminalLifecyclePayload {
	terminalId: string;
	kind: "created" | "destroyed" | "attached" | "detached";
}

/** Payload for port:changed events. */
export interface PortChangedPayload {
	eventType: "add" | "remove";
	port: {
		workspaceId: string;
		terminalId: string;
		port: number;
	};
	label: string | null;
}

/**
 * Event bus instance for subscribing to workspace events.
 * The actual implementation uses WebSocket connections to the host-service.
 */
export interface EventBus {
	on(
		type: string,
		workspaceId: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		callback: (workspaceId: string, payload: any) => void,
	): () => void;
	watchFs(workspaceId: string): void;
	unwatchFs(workspaceId: string): void;
	retain(): () => void;
}

/**
 * Get the event bus for a host-service URL.
 * Phase 5 stub: returns a no-op event bus. Replace with actual WebSocket
 * implementation when the workspace-client package is integrated.
 */
export function getEventBus(
	_hostUrl: string,
	_getToken: () => string | null,
): EventBus {
	const noop = () => {};
	return {
		on: () => noop,
		watchFs: noop,
		unwatchFs: noop,
		retain: () => noop,
	};
}

/**
 * Stub workspaceTrpc for hooks that use tRPC React hooks to communicate
 * with the host-service. The actual @superset/workspace-client provides
 * a createTRPCReact instance for the host-service AppRouter.
 *
 * Phase 5: Replace with actual workspaceTrpc when the workspace-client
 * package is integrated. For now, hooks that depend on workspaceTrpc
 * will use getHostServiceClientByUrl for imperative calls instead.
 */
export const workspaceTrpc = {
	useUtils: () => ({
		filesystem: {
			listDirectory: {
				getData: (_input: unknown): { entries: FsEntry[] } | undefined =>
					undefined,
				fetch: async (_input: unknown): Promise<{ entries: FsEntry[] }> => {
					throw new Error(
						"workspaceTrpc.filesystem.listDirectory.fetch not implemented",
					);
				},
			},
		},
		git: {
			getStatus: {
				invalidate: async (_input: unknown) => {},
			},
			getDiff: {
				invalidate: async (_input: unknown) => {},
			},
			getBaseBranch: {
				invalidate: async (_input: unknown) => {},
			},
		},
	}),
	git: {
		getBaseBranch: {
			useQuery: (
				_input: unknown,
				_opts?: unknown,
			): {
				data: { baseBranch: string | null } | null;
				isLoading: boolean;
				error: unknown;
			} => ({
				data: null,
				isLoading: false,
				error: null,
			}),
		},
		getStatus: {
			useQuery: (
				_input: unknown,
				_opts?: unknown,
			): { data: unknown; isLoading: boolean; error: unknown } => ({
				data: null,
				isLoading: false,
				error: null,
			}),
		},
	},
	terminal: {
		writeInput: {
			useMutation: () => ({
				mutateAsync: async (_input: unknown) => {
					throw new Error(
						"workspaceTrpc.terminal.writeInput.mutateAsync not implemented",
					);
				},
				isPending: false,
			}),
		},
	},
};
