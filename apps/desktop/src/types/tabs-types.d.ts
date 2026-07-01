/**
 * Type declarations for shared/tabs-types.
 * Stub for types used by agent-session-orchestrator (not yet migrated from Superset).
 */

declare module "shared/tabs-types" {
	export interface ChatLaunchConfig {
		sessionId?: string;
		thinkingLevel?: string;
		[key: string]: unknown;
	}
}
