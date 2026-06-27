import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getHostServiceProcedures } from "renderer/lib/host-service-client";
import type { HostServiceProcedures } from "renderer/lib/host-service/host-service-router";
import { useWorkspaceEvent } from "../useWorkspaceEvent";
import { useWorkspaceHostUrl } from "../useWorkspaceHostUrl";

type TerminalAgentBindings = Awaited<
  ReturnType<HostServiceProcedures["terminalAgents"]["listByWorkspace"]["query"]>
>;
export type TerminalAgentBinding = TerminalAgentBindings[number];

/**
 * Map of `terminalId → agent binding` for a workspace, read from the host
 * store and invalidated on `agent:lifecycle` / `terminal:lifecycle` events.
 */
export function useTerminalAgentBindings(
  workspaceId: string,
): Map<string, TerminalAgentBinding> {
  const hostUrl = useWorkspaceHostUrl(workspaceId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["terminal-agent-bindings", hostUrl, workspaceId] as const,
    [hostUrl, workspaceId],
  );

  const enabled = Boolean(workspaceId) && Boolean(hostUrl);

  const { data } = useQuery({
    queryKey,
    enabled,
    queryFn: () => {
      if (!hostUrl) return [] as TerminalAgentBindings;
      return getHostServiceProcedures(
        hostUrl,
      ).terminalAgents.listByWorkspace.query({ workspaceId });
    },
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  useWorkspaceEvent("agent:lifecycle", workspaceId, invalidate, enabled);
  useWorkspaceEvent("terminal:lifecycle", workspaceId, invalidate, enabled);

  return useMemo(() => {
    const map = new Map<string, TerminalAgentBinding>();
    for (const binding of data ?? []) {
      map.set(binding.terminalId, binding);
    }
    return map;
  }, [data]);
}

export function useTerminalAgentBinding(
  workspaceId: string,
  terminalId: string,
): TerminalAgentBinding | undefined {
  const bindings = useTerminalAgentBindings(workspaceId);
  return bindings.get(terminalId);
}
