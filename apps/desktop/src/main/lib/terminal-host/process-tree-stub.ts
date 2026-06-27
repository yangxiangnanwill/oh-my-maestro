/**
 * Stub: @superset/pty-daemon/process-tree — Process Tree Utilities
 *
 * Phase 3: Minimal stub. Provides placeholder implementations for
 * process signal management. Full implementation will be migrated
 * from Superset in Phase 4.
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
