// TODO: Phase 5 — useCreateOrAttachWithTheme
// This hook depends on renderer/stores/theme (useTheme, resolveTerminalThemeType)
// which will be migrated in a later phase.
// For now, this is a stub that passes through terminal.createOrAttach without theme injection.

import { electronTrpc } from "renderer/lib/electron-trpc";

export function useCreateOrAttachWithTheme() {
	const mutation = electronTrpc.terminal.createOrAttach.useMutation();
	const { mutate, mutateAsync, ...mutationState } = mutation;

	return {
		...mutationState,
		mutate,
		mutateAsync,
	};
}
