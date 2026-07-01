/**
 * Workspace runtime registry stub.
 * Phase 4: Minimal stub for terminal and projects router dependencies.
 * Full implementation will be migrated from Superset in a later task.
 */

import type { EventEmitter } from "node:events";
import type { ListSessionsResponse } from "./terminal-host/types";

interface TerminalCapabilities {
	persistent: boolean;
	coldRestore: boolean;
}

interface TerminalManagement {
	listSessions(): Promise<ListSessionsResponse>;
	killAllSessions(): Promise<void>;
	resetHistoryPersistence(): Promise<void>;
}

interface TerminalSessionOperations {
	createOrAttach(
		params: Record<string, unknown>,
	): Promise<Record<string, unknown>>;
	cancelCreateOrAttach(params: { paneId: string; requestId: string }): void;
	write(params: { paneId: string; data: string }): void;
	resize(params: { paneId: string; cols: number; rows: number }): void;
	signal(params: { paneId: string; signal?: string }): void;
	kill(params: { paneId: string }): Promise<void>;
	detach(params: { paneId: string }): void;
	clearScrollback(params: { paneId: string }): void | Promise<void>;
	ackColdRestore(paneId: string): void;
	getSession(
		paneId: string,
	): { isAlive: boolean; cwd: string; lastActive: number } | null;
	killByWorkspaceId(workspaceId: string): Promise<{ failed: number }>;
	getSessionCountByWorkspaceId(workspaceId: string): number;
}

interface TerminalRuntime extends TerminalSessionOperations, EventEmitter {
	management: TerminalManagement;
	capabilities: TerminalCapabilities;
	cleanup(): Promise<void>;
}

interface WorkspaceRuntime {
	id: string;
	terminal: TerminalRuntime;
	capabilities: {
		terminal: TerminalCapabilities;
	};
}

class WorkspaceRuntimeRegistry {
	private entries = new Map<string, WorkspaceRuntime>();

	getForWorkspaceId(workspaceId: string): WorkspaceRuntime {
		const existing = this.entries.get(workspaceId);
		if (existing) return existing;

		const stub = this.createStubRuntime();
		this.entries.set(workspaceId, stub);
		return stub;
	}

	getDefault(): WorkspaceRuntime {
		const defaultId = "__default__";
		const existing = this.entries.get(defaultId);
		if (existing) return existing;

		const stub = this.createStubRuntime();
		this.entries.set(defaultId, stub);
		return stub;
	}

	private createStubRuntime(): WorkspaceRuntime {
		const capabilities: TerminalCapabilities = {
			persistent: false,
			coldRestore: false,
		};

		const management: TerminalManagement = {
			listSessions: async () => ({ sessions: [] }),
			killAllSessions: async () => {},
			resetHistoryPersistence: async () => {},
		};

		const terminal = {
			capabilities,
			management,
			createOrAttach: async () => ({
				isNew: true,
				scrollback: "",
				wasRecovered: false,
			}),
			cancelCreateOrAttach: () => {},
			write: () => {},
			resize: () => {},
			signal: () => {},
			kill: async () => {},
			detach: () => {},
			clearScrollback: () => {},
			ackColdRestore: () => {},
			getSession: () => null,
			killByWorkspaceId: async () => ({ failed: 0 }),
			getSessionCountByWorkspaceId: () => 0,
			cleanup: async () => {},
			// EventEmitter stubs
			on: () => terminal,
			off: () => terminal,
			emit: () => false,
			removeAllListeners: () => terminal,
			detachAllListeners: () => {},
		} as unknown as TerminalRuntime;

		return {
			id: "stub",
			terminal,
			capabilities: { terminal: capabilities },
		};
	}
}

const registry = new WorkspaceRuntimeRegistry();

export function getWorkspaceRuntimeRegistry(): WorkspaceRuntimeRegistry {
	return registry;
}
