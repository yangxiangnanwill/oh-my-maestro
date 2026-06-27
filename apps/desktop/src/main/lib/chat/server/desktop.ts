/**
 * Phase 4 stub: @superset/chat/server/desktop
 * Original Superset chat service - full implementation pending chat package migration.
 */

export class ChatService {
	// Phase 4 stub - full implementation pending chat package migration
}

export function createChatServiceRouter(_service: ChatService) {
	// Phase 4 stub - returns empty router
	return {} as ReturnType<typeof import("../../../../lib/trpc").router>;
}

/**
 * Phase 4 stub: Generates a title from a user message using an AI model.
 * Full implementation pending chat package migration.
 */
export async function generateTitleFromMessage(_params: {
	message: string;
	agentModel: unknown;
	agentId: string;
	agentName: string;
	instructions: string;
	tracingContext?: Record<string, unknown>;
}): Promise<string | null> {
	// Phase 4 stub: no AI model available
	return null;
}
