// TODO: Phase 5 — useSignOut
// This hook depends on electronTrpc.auth.signOut (not yet implemented),
// and the full auth client.
// For now, this is a stub that clears local auth state.

import { authClient } from "renderer/lib/auth-client";
import { electronTrpc } from "renderer/lib/electron-trpc";

export const AUTH_COMPLETED_KEY = "superset_auth_completed";
export const ACTIVE_ORG_ID_KEY = "active_organization_id";

export function useSignOut() {
	// TODO: Add electronTrpc.auth.signOut.useMutation() when auth router is implemented
	// TODO: Add analytics.reset() when analytics is migrated
	const setAnalyticsUserId = electronTrpc.analytics.setUserId.useMutation();

	return async () => {
		// analytics.reset(); // TODO: uncomment when analytics is migrated
		setAnalyticsUserId.mutate({ userId: null });
		localStorage.removeItem(AUTH_COMPLETED_KEY);
		localStorage.removeItem(ACTIVE_ORG_ID_KEY);
		await authClient.signOut();
		// signOutMutation.mutate(); // TODO: uncomment when auth.signOut is implemented
	};
}
