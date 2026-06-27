import { buildHostRoutingKey } from "renderer/lib/host-routing";
import { useMemo } from "react";
import { useRelayUrl } from "renderer/hooks/useRelayUrl";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";

export type WorkspaceHostTarget =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "local-starting"; hostId: string }
  | { status: "ready"; kind: "local" | "remote"; hostId: string; url: string };

/**
 * Resolves a workspace ID to its owning host-service target.
 *
 * The status union lets callers distinguish "still loading the collection"
 * from "local host hasn't booted yet" from "workspace doesn't exist on this
 * client" — three states the previous `string | null` API collapsed into one.
 *
 * Phase 5: Uses a simplified resolver. The Superset implementation uses
 * TanStack DB live queries against the Electric SQL collections layer.
 * This stub resolves all workspace IDs through the local host-service.
 * Replace with the DB-backed implementation when CollectionsProvider is
 * fully integrated.
 */
export function useWorkspaceHostTarget(
  workspaceId: string | null,
): WorkspaceHostTarget {
  const { machineId, activeHostUrl } = useLocalHostService();
  const relayUrl = useRelayUrl();

  return useMemo(() => {
    if (!workspaceId) return { status: "loading" };

    // Phase 5 stub: resolve all workspaces through the local host-service.
    // The actual implementation queries the v2Workspaces collection to find
    // the workspace's hostId and organizationId, then constructs the
    // appropriate URL (local or relay).
    if (activeHostUrl) {
      return {
        status: "ready",
        kind: "local",
        hostId: machineId ?? "local",
        url: activeHostUrl,
      };
    }

    return { status: "local-starting", hostId: machineId ?? "local" };
  }, [workspaceId, machineId, activeHostUrl, relayUrl]);
}

/**
 * Backwards-compatible URL-only form for existing callers. Returns null
 * for any non-`ready` status (loading, local-starting, not-found).
 */
export function useWorkspaceHostUrl(workspaceId: string | null): string | null {
  const target = useWorkspaceHostTarget(workspaceId);
  return target.status === "ready" ? target.url : null;
}
