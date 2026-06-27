// Phase 4: Host routing types (migrated from Superset @superset/shared/host-routing)
// Minimal stub — full host routing is handled by renderer/lib/host-routing.ts.

export type HostRoutingKey = string;

/**
 * Build a host routing key from organization and host identifiers.
 * The format is: `org/{organizationId}/host/{hostId}`
 */
export function buildHostRoutingKey(
  organizationId: string,
  hostId: string,
): HostRoutingKey {
  return `org/${encodeURIComponent(organizationId)}/host/${encodeURIComponent(hostId)}`;
}
