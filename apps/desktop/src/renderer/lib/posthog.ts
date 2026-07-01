// PostHog stub — analytics not yet migrated
// Replace with real PostHog integration when needed

const _noop = () => {};

export const posthog = {
	capture: (_event: string, _properties?: Record<string, unknown>) => {},
	identify: (_id: string, _properties?: Record<string, unknown>) => {},
	reset: () => {},
	init: (_key: string, _options?: Record<string, unknown>) => {},
} as const;

export default posthog;
