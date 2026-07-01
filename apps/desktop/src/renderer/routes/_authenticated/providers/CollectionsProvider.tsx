/**
 * CollectionsProvider stub.
 *
 * Provides workspace and host collection data via TanStack DB live queries.
 * Used by useWorkspaceHostTarget to look up workspace-to-host mappings.
 *
 * Phase 5: Replace with actual CollectionsProvider when the database
 * collections layer is integrated. For now, provides stub values so
 * consuming hooks compile.
 */
import { createContext, useContext, type ReactNode } from "react";

/** Minimal stub for the v2 workspaces table used by useWorkspaceHostTarget. */
const v2WorkspacesStub = {
	id: { type: "text" as const },
	organizationId: { type: "text" as const },
	hostId: { type: "text" as const },
};

interface CollectionsContextValue {
	v2Workspaces: typeof v2WorkspacesStub;
}

const CollectionsContext = createContext<CollectionsContextValue>({
	v2Workspaces: v2WorkspacesStub,
});

export function CollectionsProvider({ children }: { children: ReactNode }) {
	return (
		<CollectionsContext.Provider value={{ v2Workspaces: v2WorkspacesStub }}>
			{children}
		</CollectionsContext.Provider>
	);
}

export function useCollections(): CollectionsContextValue {
	return useContext(CollectionsContext);
}
