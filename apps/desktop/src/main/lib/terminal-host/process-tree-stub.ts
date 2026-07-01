/**
 * Stub: @superset/pty-daemon/process-tree — Process Tree Utilities
 *
 * Phase 3: Minimal stub. Provides placeholder implementations for
 * process signal management. Full implementation will be migrated
 * from Superset in Phase 4.
 *
 * Phase 4 注意事项:
 * - signalProcessTreeAndGroups 当前同步返回空数组，调用方 (pty-subprocess.ts)
 *   使用同步方式消费返回值。Phase 4 迁移真实实现时需确保签名兼容。
 * - signalProcessTargets 当前返回 resolved Promise，Phase 4 需实现真实的
 *   SIGKILL 升级逻辑。
 */

export class ProcessSignalError extends Error {
	constructor(
		message: string,
		public readonly error: Error,
		public readonly target: "pid" | "pgid",
		public readonly signal: string,
		public readonly id: number,
	) {
		super(message);
		this.name = "ProcessSignalError";
	}
}

export interface ProcessSignalTarget {
	pid: number;
	/** Optional signal (defaults to "SIGTERM") */
	signal?: string;
	/** Recursively kill child processes */
	tree?: boolean;
}

export function signalProcessTargets(
	_targets: ProcessSignalTarget[],
	_signal?: string,
	_onError?: (target: ProcessSignalTarget, error: Error) => void,
): Promise<void> {
	// Stub
	return Promise.resolve();
}

export function signalProcessTreeAndGroups(
	_pid: number,
	_signal?: string,
	_options?: {
		signalPids?: boolean;
		onSignalError?: (error: ProcessSignalError) => void;
	},
): ProcessSignalTarget[] {
	// Stub
	return [];
}
