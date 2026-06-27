/**
 * Environment variables for the MAIN PROCESS (Node.js context).
 *
 * This file uses t3-env with process.env which works at runtime in Node.js.
 * Only import this file in src/main/ code - never in renderer or shared code.
 *
 * For renderer process env vars, use src/renderer/env.renderer.ts instead.
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		DESKTOP_VITE_PORT: z.string().default("5173"),
		NEXT_PUBLIC_API_URL: z.string().default("https://api.maestro.sh"),
		ANTHROPIC_API_KEY: z.string().optional(),
		OPENAI_API_KEY: z.string().optional(),
	},

	runtimeEnv: {
		...process.env,
		NODE_ENV: process.env.NODE_ENV,
		DESKTOP_VITE_PORT: process.env.DESKTOP_VITE_PORT,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
	},
	emptyStringAsUndefined: true,
	// Only allow skipping validation in development (never in production)
	skipValidation:
		process.env.NODE_ENV === "development" && !!process.env.SKIP_ENV_VALIDATION,

	// Main process runs in trusted Node.js environment
	isServer: true,
});
