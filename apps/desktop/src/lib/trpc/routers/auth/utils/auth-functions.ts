/**
 * Stub: lib/trpc/routers/auth/utils/auth-functions
 *
 * Phase 3: Minimal stub. Auth utility functions will be implemented
 * when authentication is migrated from Superset in Phase 4.
 */

import { EventEmitter } from "node:events";

/**
 * Event emitter for auth-related events.
 * Used by tRPC subscription to notify renderer of token changes.
 *
 * Events:
 * - "token-saved": { token, expiresAt } - New token saved (OAuth callback)
 * - "token-cleared": (no data) - Token deleted (sign-out)
 */
export const authEvents = new EventEmitter();

export function getAuthToken(): string | null {
  return null;
}

export function validateAuthToken(_token: string): boolean {
  return false;
}

export function handleAuthCallback(_url: string): Promise<void> {
  return Promise.resolve();
}

// Phase 4: Updated to return object shape for settings router compatibility (migrated from Superset)
export async function loadToken(): Promise<{
	token: string | null;
	expiresAt: string | null;
}> {
	return { token: null, expiresAt: null };
}

export function parseAuthDeepLink(_url: string): Record<string, string> {
  return {};
}
