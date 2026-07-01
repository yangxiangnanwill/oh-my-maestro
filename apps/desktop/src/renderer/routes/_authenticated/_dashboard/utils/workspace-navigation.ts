// Stub: renderer/routes/_authenticated/_dashboard/utils/workspace-navigation
// Provides navigation utility for opening workspaces.

import type { NavigateOptions } from "@tanstack/react-router";

export function navigateToWorkspace(
	workspaceId: string,
	navigate: (opts: NavigateOptions) => void,
	/** @param _opts Phase 4: 将传递给 navigate() 以支持 replace/push 等导航选项 */
	_opts?: NavigateOptions,
): void {
	// TODO: Phase 4 — 使用 _opts 参数替换 as never 断言
	navigate({
		to: "/workspaces/$workspaceId" as never,
		params: { workspaceId } as never,
	});
}
