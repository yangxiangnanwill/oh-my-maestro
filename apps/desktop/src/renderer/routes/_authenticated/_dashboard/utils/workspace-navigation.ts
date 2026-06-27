// Stub: renderer/routes/_authenticated/_dashboard/utils/workspace-navigation
// Provides navigation utility for opening workspaces.

import type { NavigateOptions } from "@tanstack/react-router";

export function navigateToWorkspace(
  workspaceId: string,
  navigate: (opts: NavigateOptions) => void,
): void {
  navigate({ to: "/workspaces/$workspaceId", params: { workspaceId } });
}
