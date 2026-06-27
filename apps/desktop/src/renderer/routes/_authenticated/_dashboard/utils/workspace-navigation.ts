// Stub: renderer/routes/_authenticated/_dashboard/utils/workspace-navigation
// Provides navigation utility for opening workspaces.

import type { NavigateOptions } from "@tanstack/react-router";

export function navigateToWorkspace(
  workspaceId: string,
  navigate: (opts: NavigateOptions) => void,
  _opts?: NavigateOptions,
): void {
  navigate({ to: "/workspaces/$workspaceId" as never, params: { workspaceId } as never });
}
