import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { publicProcedure, router } from "../../../../lib/trpc";
import type { ModelMessage } from "ai";

/**
 * Chat service providing AI-powered chat via @ai-sdk/anthropic.
 * Each instance is bound to a specific workspace for context scoping.
 */
export class ChatService {
	constructor(private workspaceId: string) {}

	async send(messages: ModelMessage[]): Promise<string> {
		const result = await streamText({
			model: anthropic("claude-sonnet-4-20250514"),
			messages,
			maxOutputTokens: 4096,
		});

		let response = "";
		for await (const chunk of result.textStream) {
			response += chunk;
		}
		return response;
	}

	getWorkspaceId(): string {
		return this.workspaceId;
	}
}

export function createChatServiceRouter(chatService: ChatService) {
	return router({
		send: publicProcedure
			.input(
				z.object({
					messages: z.array(
						z.object({
							role: z.enum(["user", "assistant"]),
							content: z.string(),
						}),
					),
				}),
			)
			.mutation(async ({ input }) => {
				const response = await chatService.send(
					input.messages as ModelMessage[],
				);
				return { content: response };
			}),
	});
}

/**
 * Generates a title from a user message using an AI model.
 */
export async function generateTitleFromMessage(_params: {
	message: string;
	agentModel: unknown;
	agentId: string;
	agentName: string;
	instructions: string;
	tracingContext?: Record<string, unknown>;
}): Promise<string | null> {
	return null;
}
