/**
 * Shared environment variables accessible from both main and lib layers.
 * Uses t3-env for validation, same pattern as main/env.main.ts.
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		DESKTOP_VITE_PORT: z.string().default("5173"),
	},

	runtimeEnv: {
		...process.env,
		NODE_ENV: process.env.NODE_ENV,
		DESKTOP_VITE_PORT: process.env.DESKTOP_VITE_PORT,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.NODE_ENV === "development" && !!process.env.SKIP_ENV_VALIDATION,

	isServer: true,
});
