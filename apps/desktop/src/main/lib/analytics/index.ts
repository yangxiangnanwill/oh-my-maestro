/**
 * Phase 4: Analytics module (migrated from Superset main/lib/analytics).
 * Tracks user events via PostHog when available.
 */

import { DEFAULT_TELEMETRY_ENABLED } from "shared/constants";

let userId: string | null = null;

// Use dynamic import for posthog-node since it may not be installed
const _posthogClient: unknown = null;

async function _getClient(): Promise<unknown | null> {
	// Phase 4: PostHog not yet configured for oh-my-maestro
	// Full implementation pending analytics configuration migration
	return null;
}

export function getUserId(): string | null {
	return userId;
}

function _isTelemetryEnabled(): boolean {
	return DEFAULT_TELEMETRY_ENABLED;
}

export function setUserId(id: string | null): void {
	userId = id;
}

export function track(
	_event: string,
	_properties?: Record<string, unknown>,
): void {
	// Phase 4: Analytics not yet configured
	// Full implementation pending analytics configuration migration
}
