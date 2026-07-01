/**
 * Type declaration for renderer/routes/_authenticated/hooks/useDashboardSidebarState.
 * Minimal stub.
 */

declare module "renderer/routes/_authenticated/hooks/useDashboardSidebarState" {
	export function useDashboardSidebarState(): {
		isCollapsed: boolean;
		toggleCollapsed: () => void;
		setCollapsed: (collapsed: boolean) => void;
	};
}
