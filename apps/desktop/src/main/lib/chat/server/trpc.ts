// Phase 4 stub: @superset/chat/server/trpc
// Original Superset chat runtime service - full implementation pending chat package migration

export interface LifecycleEvent {
	sessionId: string;
	eventType: string;
}

export interface ChatRuntimeServiceOptions {
	headers: () => Promise<Record<string, string>>;
	apiUrl: string;
	onLifecycleEvent?: (event: LifecycleEvent) => void;
}

export class ChatRuntimeService {
	createRouter() {
		// Phase 4 stub - returns empty router
		return {} as ReturnType<typeof import("../../../../lib/trpc").router>;
	}
}
