// Stub: renderer/stores/set-preferred-open-in-app-intent
// Provides intent store for setting preferred external app.
// Full implementation will be migrated from Superset in a later phase.

import { create } from "zustand";

interface SetPreferredOpenInAppRequest {
	projectId: string;
	app: string;
}

interface SetPreferredOpenInAppIntentState {
	request: (req: SetPreferredOpenInAppRequest) => void;
}

export const useSetPreferredOpenInAppIntent = create<SetPreferredOpenInAppIntentState>(() => ({
	request: (_req) => {
		// Stub: no-op until preferred app integration is complete
	},
}));
