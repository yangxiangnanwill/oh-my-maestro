import {
	createChatServiceRouter as buildRouter,
	ChatService,
} from "main/lib/chat/server/desktop";

// ChatService is created per-workspace in the router. The shared instance
// below is used as a fallback; procedure inputs carry the workspace context.
const sharedChatService = new ChatService("default");

export const createChatServiceRouter = () => buildRouter(sharedChatService);

export type ChatServiceDesktopRouter = ReturnType<
	typeof createChatServiceRouter
>;
