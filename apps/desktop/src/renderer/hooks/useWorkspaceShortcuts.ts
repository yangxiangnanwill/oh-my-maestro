// TODO: Phase 5 — useWorkspaceShortcuts
// This hook depends on renderer/hotkeys (useHotkey) and
// renderer/routes/_authenticated/_dashboard/utils/workspace-navigation
// (navigateToWorkspace) which will be migrated in a later phase.
// For now, this is a stub that registers the hotkey names as no-ops.

import { useCallback } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";

/**
 * Shared hook for workspace keyboard shortcuts.
 * Used by WorkspaceSidebar for navigation between workspaces.
 *
 * Handles Cmd+1-9 workspace switching shortcuts (global).
 * Currently a stub — full implementation pending hotkeys migration.
 */
export function useWorkspaceShortcuts() {
	const { data: groups = [] } =
		electronTrpc.workspaces.getAllGrouped.useQuery();

	const allWorkspaces = groups.flatMap((group) => {
		const topLevelWorkspacesById = new Map(
			group.workspaces.map((workspace) => [workspace.id, workspace]),
		);
		const sectionsById = new Map(
			(group.sections ?? []).map((section) => [section.id, section]),
		);

		return group.topLevelItems.flatMap((item) => {
			if (item.kind === "workspace") {
				const workspace = topLevelWorkspacesById.get(item.id);
				return workspace ? [workspace] : [];
			}

			return sectionsById.get(item.id)?.workspaces ?? [];
		});
	});

	// TODO: Register hotkeys via useHotkey when renderer/hotkeys migration is complete
	const switchToWorkspace = useCallback(
		(_index: number) => {
			// const workspace = allWorkspaces[_index];
			// if (workspace) navigateToWorkspace(workspace.id, navigate);
		},
		[],
	);

	// Hotkeys are registered as no-ops until hotkeys migration is complete
	// useHotkey("JUMP_TO_WORKSPACE_1", () => switchToWorkspace(0));
	// ... (1-9)

	void switchToWorkspace; // Suppress unused warning

	return {
		groups,
		allWorkspaces,
	};
}
