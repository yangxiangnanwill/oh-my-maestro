// Stub: renderer/react-query/workspaces/useCreateFromPr
// Creates a workspace from a PR URL.
// Full implementation will be migrated from Superset in a later phase.

import { electronTrpc } from "renderer/lib/electron-trpc";

interface CreateFromPrInput {
	projectId: string;
	prUrl: string;
}

export function useCreateFromPr() {
	const mutation = electronTrpc.workspaces.create.useMutation();

	const mutateAsyncWithSetup = async (
		input: CreateFromPrInput,
		_agentLaunchRequest?: unknown,
	) => {
		return mutation.mutateAsync({
			projectId: input.projectId,
			prompt: `PR: ${input.prUrl}`,
		});
	};

	return {
		...mutation,
		mutateAsyncWithSetup,
	};
}
