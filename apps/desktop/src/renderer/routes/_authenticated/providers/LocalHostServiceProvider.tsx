/**
 * LocalHostService provider stub.
 *
 * Provides host-service connection context used by host-service hooks
 * (useWorkspaceHostTarget, useWorkspaceHostUrl, useDestroyWorkspace, etc.)
 * and the DashboardSidebar.
 *
 * Phase 5: Replace with actual provider when the host-service lifecycle
 * management is integrated. For now, provides stub values so consuming
 * hooks compile and can be tested.
 */
import { createContext, useContext, type ReactNode, useState } from "react";

interface LocalHostServiceContextValue {
	machineId: string | null;
	activeHostUrl: string | null;
	setActiveHostUrl: (url: string | null) => void;
}

const LocalHostServiceContext = createContext<LocalHostServiceContextValue>({
	machineId: null,
	activeHostUrl: null,
	setActiveHostUrl: () => {},
});

export function LocalHostServiceProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [activeHostUrl, setActiveHostUrl] = useState<string | null>(null);

	return (
		<LocalHostServiceContext.Provider
			value={{ machineId: null, activeHostUrl, setActiveHostUrl }}
		>
			{children}
		</LocalHostServiceContext.Provider>
	);
}

export function useLocalHostService(): LocalHostServiceContextValue {
	return useContext(LocalHostServiceContext);
}
