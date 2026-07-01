// Phase 3 stub — will be replaced by Phase 4 shared/env.shared
// Used by agent-wrappers to access desktop notification port

export const env = {
	get DESKTOP_NOTIFICATIONS_PORT(): number {
		return Number(process.env.DESKTOP_NOTIFICATIONS_PORT) || 11434;
	},
};
