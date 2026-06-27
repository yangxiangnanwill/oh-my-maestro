/**
 * Stub: @superset/pty-daemon/process-tree — Process Tree Utilities
 *
 * Phase 3: Minimal stub. Provides placeholder implementations for
 * process signal management. Full implementation will be migrated
 * from Superset in Phase 4.
 */

export class ProcessSignalError extends Error {
  constructor(message: string) {
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
): Promise<void> {
  // Stub
  return Promise.resolve();
}

export function signalProcessTreeAndGroups(
  _pid: number,
  _signal?: string,
): Promise<void> {
  // Stub
  return Promise.resolve();
}
