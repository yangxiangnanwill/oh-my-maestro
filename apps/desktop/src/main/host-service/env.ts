/**
 * Environment variables for the Host Service process.
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		HOST_SERVICE_PORT: z.coerce.number().default(3001),
		HOST_SERVICE_SECRET: z.string().default("maestro-host-service-secret"),
		DESKTOP_VITE_PORT: z.coerce.number().default(5173),
	},

	runtimeEnv: {
		...process.env,
		NODE_ENV: process.env.NODE_ENV,
		HOST_SERVICE_PORT: process.env.HOST_SERVICE_PORT,
		HOST_SERVICE_SECRET: process.env.HOST_SERVICE_SECRET,
		DESKTOP_VITE_PORT: process.env.DESKTOP_VITE_PORT,
	},
	emptyStringAsUndefined: true,
	skipValidation:
		process.env.NODE_ENV === "development" && !!process.env.SKIP_ENV_VALIDATION,
	isServer: true,
});
