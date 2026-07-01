/**
 * Sentry integration for error monitoring in the Electron main process.
 *
 * This file is OPTIONAL and disabled by default.
 * To enable, install @sentry/electron and set SENTRY_DSN_DESKTOP env var.
 *
 * Usage (in main/index.ts):
 *   import { initSentry } from "./lib/sentry";
 *   initSentry();
 */

// import * as Sentry from "@sentry/electron/main";
// import { IPCMode } from "@sentry/electron/main";
// import { session } from "electron";
// import { env } from "../env.main";

const sentryInitialized = false;

export function initSentry(): void {
	if (sentryInitialized) return;

	// TODO: Phase 4+ — Enable Sentry when @sentry/electron is added to project
	// Requires: bun add @sentry/electron
	//
	// if (!env.SENTRY_DSN_DESKTOP || env.NODE_ENV !== "production") {
	//   return;
	// }
	//
	// Sentry.init({
	//   dsn: env.SENTRY_DSN_DESKTOP,
	//   environment: env.NODE_ENV,
	//   tracesSampleRate: 0.1,
	//   sendDefaultPii: false,
	//   ipcMode: IPCMode.Classic,
	//   getSessions: () => [session.defaultSession],
	// });
	//
	// sentryInitialized = true;

	console.log(
		"[sentry] Sentry is not enabled — install @sentry/electron and configure SENTRY_DSN_DESKTOP to enable",
	);
}
