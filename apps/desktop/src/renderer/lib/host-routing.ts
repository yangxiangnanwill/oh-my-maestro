/**
 * Host routing key builder, replacing @superset/shared/host-routing.
 *
 * Builds a routing key string from an organization ID and host (machine) ID.
 * Used by useHostUrl, useWorkspaceHostTarget, and resolveHostUrl to construct
 * relay-based URLs for reaching host-service instances on remote machines.
 *
 * Phase 5: Replace with actual @superset/shared/host-routing when the
 * shared package is integrated into the project.
 */

/**
 * Build a host routing key from organization and host identifiers.
 * The format is: `org/{organizationId}/host/{hostId}`
 */
export function buildHostRoutingKey(
	organizationId: string,
	hostId: string,
): string {
	return `org/${encodeURIComponent(organizationId)}/host/${encodeURIComponent(hostId)}`;
}
