import { useMemo } from "react";
import type { TerminalPreset } from "shared/external-app-types";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { filterMatchingPresetsForProject } from "shared/preset-project-targeting";

/** 所有 preset mutation 共享的缓存失效逻辑 */
async function invalidatePresetRelatedQueries(
	utils: ReturnType<typeof electronTrpc.useUtils>,
): Promise<void> {
	await utils.settings.getTerminalPresets.invalidate();
	await utils.settings.getWorkspaceCreationPresets.invalidate();
	await utils.settings.getNewTabPresets.invalidate();
	await utils.workspaces.getWorkspaceRunDefinition.invalidate();
	await utils.workspaces.getResolvedRunCommands.invalidate();
}

function useCreateTerminalPreset(
	options?: Parameters<
		typeof electronTrpc.settings.createTerminalPreset.useMutation
	>[0],
) {
	const utils = electronTrpc.useUtils();

	return electronTrpc.settings.createTerminalPreset.useMutation({
		...options,
		onSuccess: async (...args) => {
			await invalidatePresetRelatedQueries(utils);
			await options?.onSuccess?.(...args);
		},
	});
}

function useUpdateTerminalPreset(
	options?: Parameters<
		typeof electronTrpc.settings.updateTerminalPreset.useMutation
	>[0],
) {
	const utils = electronTrpc.useUtils();

	return electronTrpc.settings.updateTerminalPreset.useMutation({
		...options,
		onSuccess: async (...args) => {
			await invalidatePresetRelatedQueries(utils);
			await options?.onSuccess?.(...args);
		},
	});
}

function useDeleteTerminalPreset(
	options?: Parameters<
		typeof electronTrpc.settings.deleteTerminalPreset.useMutation
	>[0],
) {
	const utils = electronTrpc.useUtils();

	return electronTrpc.settings.deleteTerminalPreset.useMutation({
		...options,
		onSuccess: async (...args) => {
			await invalidatePresetRelatedQueries(utils);
			await options?.onSuccess?.(...args);
		},
	});
}

function useSetPresetAutoApply(
	options?: Parameters<
		typeof electronTrpc.settings.setPresetAutoApply.useMutation
	>[0],
) {
	const utils = electronTrpc.useUtils();

	return electronTrpc.settings.setPresetAutoApply.useMutation({
		...options,
		onSuccess: async (...args) => {
			await invalidatePresetRelatedQueries(utils);
			await options?.onSuccess?.(...args);
		},
	});
}

function useReorderTerminalPresets(
	options?: Parameters<
		typeof electronTrpc.settings.reorderTerminalPresets.useMutation
	>[0],
) {
	const utils = electronTrpc.useUtils();

	return electronTrpc.settings.reorderTerminalPresets.useMutation({
		...options,
		onSuccess: async (...args) => {
			await invalidatePresetRelatedQueries(utils);
			await options?.onSuccess?.(...args);
		},
	});
}

export function usePresets(projectId?: string | null) {
	const { data: presets, isLoading } =
		electronTrpc.settings.getTerminalPresets.useQuery() as {
			data: TerminalPreset[] | undefined;
			isLoading: boolean;
		};
	const matchedPresets = useMemo(
		() => filterMatchingPresetsForProject(presets ?? [], projectId),
		[presets, projectId],
	);

	const createPreset = useCreateTerminalPreset();
	const updatePreset = useUpdateTerminalPreset();
	const deletePreset = useDeleteTerminalPreset();
	const setPresetAutoApply = useSetPresetAutoApply();
	const reorderPresets = useReorderTerminalPresets();

	return {
		presets,
		matchedPresets,
		isLoading,
		createPreset,
		updatePreset,
		deletePreset,
		setPresetAutoApply,
		reorderPresets,
	};
}
