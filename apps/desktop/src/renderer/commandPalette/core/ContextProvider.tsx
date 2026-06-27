import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";
import type { CommandContext } from "./types";

const Context = createContext<CommandContext | null>(null);

export function CommandContextProvider({ children }: { children: ReactNode }) {
	const location = useLocation();
	const navigate = useNavigate();
	const { activeHostUrl } = useLocalHostService();

	const navigateTo = useCallback(
		(path: string) => {
			void (navigate as (opts: { to: string }) => void)({ to: path });
		},
		[navigate],
	);

	const context = useMemo<CommandContext>(
		() => ({
			route: { pathname: location.pathname, params: {} },
			workspace: null,
			activeHostUrl,
			activeOrganizationId: null,
			activeOrganizationName: null,
			hostServiceStatus: "unknown",
			localMachineId: null,
			notificationSoundsMuted: false,
			navigate: navigateTo,
		}),
		[location.pathname, activeHostUrl, navigateTo],
	);

	return <Context.Provider value={context}>{children}</Context.Provider>;
}

export function useCommandContext(): CommandContext {
	const ctx = useContext(Context);
	if (!ctx) {
		throw new Error(
			"useCommandContext must be used within CommandContextProvider",
		);
	}
	return ctx;
}
