/**
 * Type stubs for @superset/host-service types used by host-service hooks.
 *
 * These types are used by useDestroyWorkspace and useGitStatusMap hooks.
 *
 * Phase 5: Replace with actual @superset/host-service types when the
 * host-service package is integrated.
 */

/**
 * Cause information for a teardown failure, returned by the host-service
 * when it cannot clean up workspace resources.
 */
export interface TeardownFailureCause {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Cause information when a delete operation is already in progress for
 * the same workspace.
 */
export interface DeleteInProgressCause {
  message: string;
  startedAt?: string;
}
