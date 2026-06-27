import { observable } from "@trpc/server/observable";
import { publicProcedure, router } from "../..";
import { authEvents, loadToken } from "./utils/auth-functions";

// Phase 3 stub — full implementation will be migrated from Superset in Phase 4
export function createAuthRouter() {
  return router({
    getStoredToken: publicProcedure.query(() => loadToken()),

    /**
     * Subscribe to auth events. Only fires for actual changes:
     * - New authentication (OAuth callback) -> { token, expiresAt }
     * - Sign out -> null
     *
     * Does NOT emit on subscribe - use getStoredToken for initial hydration.
     */
    onTokenChanged: publicProcedure.subscription(() => {
      return observable<{ token: string; expiresAt: string } | null>((emit) => {
        const handleSaved = (data: { token: string; expiresAt: string }) => {
          emit.next(data);
        };

        const handleCleared = () => {
          emit.next(null);
        };

        authEvents.on("token-saved", handleSaved);
        authEvents.on("token-cleared", handleCleared);

        return () => {
          authEvents.off("token-saved", handleSaved);
          authEvents.off("token-cleared", handleCleared);
        };
      });
    }),
  });
}
