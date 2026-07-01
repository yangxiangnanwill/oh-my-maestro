/**
 * Stub: @superset/pty-daemon — PTY Daemon Server
 *
 * Phase 3: Minimal stub. Full implementation will be migrated from Superset
 * in a subsequent phase.
 */

// Re-export the protocol types we have
export type { HandoffMessage } from "./pty-daemon-protocol";

// Snapshot types for session management
export interface SnapshotSessionData {
	sessionId: string;
	ptyFd: number;
	cols: number;
	rows: number;
	pid: number;
}

export interface DaemonSnapshot {
	sessions: SnapshotSessionData[];
}

export const DAEMON_PACKAGE_VERSION = "0.1.0";

export function readSnapshot(_snapshotPath: string): DaemonSnapshot {
	throw new Error("readSnapshot not implemented in stub");
}

export function clearSnapshot(_snapshotPath: string): void {
	throw new Error("clearSnapshot not implemented in stub");
}

export class Server {
	private socketPath: string;
	private daemonVersion: string;

	constructor(opts: {
		socketPath: string;
		daemonVersion: string;
		bufferCap?: number;
	}) {
		this.socketPath = opts.socketPath;
		this.daemonVersion = opts.daemonVersion;
	}

	async listen(): Promise<void> {
		throw new Error("Server.listen not implemented in stub");
	}

	async listenWithRetry(): Promise<void> {
		throw new Error("Server.listenWithRetry not implemented in stub");
	}

	async close(): Promise<void> {
		throw new Error("Server.close not implemented in stub");
	}

	adoptSnapshot(_snapshot: DaemonSnapshot): void {
		throw new Error("Server.adoptSnapshot not implemented in stub");
	}
}
