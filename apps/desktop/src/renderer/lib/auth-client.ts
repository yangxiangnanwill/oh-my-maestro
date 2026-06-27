/**
 * Auth client for the Maestro desktop app.
 *
 * Phase 4 integration: replace the stub with the actual Better Auth client
 * when @better-auth/* dependencies are added to the project.
 * The original Superset implementation uses:
 *   - better-auth/react (createAuthClient)
 *   - better-auth/client/plugins (organizationClient, customSessionClient, jwtClient)
 *   - @better-auth/api-key/client
 *   - @better-auth/stripe/client
 */

import { env } from "renderer/env.renderer";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
	authToken = token;
}

export function getAuthToken(): string | null {
	return authToken;
}

let jwt: string | null = null;

export function setJwt(token: string | null) {
	jwt = token;
}

export function getJwt(): string | null {
	return jwt;
}

/**
 * Stub auth client. Provides the same shape as the Better Auth client
 * so consuming code compiles. Replace with the real Better Auth client
 * when dependencies are added.
 */
export const authClient = {
	signIn: {
		email: async (_params: { email: string; password: string }) => {
			throw new Error("authClient.signIn.email not implemented — add better-auth dependency");
		},
		social: async (_params: { provider: string; callbackURL?: string }) => {
			throw new Error("authClient.signIn.social not implemented — add better-auth dependency");
		},
	},
	signOut: async (_opts?: { fetchOptions?: { throw?: boolean } }) => {
		setAuthToken(null);
		setJwt(null);
	},
	signUp: {
		email: async (_params: { email: string; password: string; name: string }) => {
			throw new Error("authClient.signUp.email not implemented — add better-auth dependency");
		},
	},
	getSession: async () => {
		return { data: null, error: null };
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	useSession: (): any => {
		return {
			data: null,
			isPending: false,
			error: null,
			refetch: async () => ({ data: null, error: null }),
		};
	},
	token: async () => {
		return { data: { token: null }, error: null };
	},
	organization: {
		getFullOrganization: async () => {
			return { data: null, error: null };
		},
	},
	apiKey: {
		list: async () => {
			return { data: [], error: null };
		},
	},
	subscription: {
		get: async () => {
			return { data: null, error: null };
		},
	},
};
