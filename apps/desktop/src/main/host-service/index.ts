/**
 * Maestro Host Service — Desktop Entry Point
 *
 * Starts a local HTTP server for Maestro-flow MCP endpoint and command chain execution.
 * Simplified from Superset's workspace service — replaces @superset/host-service
 * with a lightweight Hono server.
 *
 * TODO: Full implementation when @superset/host-service is replaced with local equivalent
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";

const SHUTDOWN_GRACE_MS = 3_000;
const WATCHDOG_INTERVAL_MS = 2_000;

type Server = ReturnType<typeof serve>;

let server: Server | null = null;

const app = new Hono();

// Health check endpoint
app.get("/health", (c) => {
	return c.json({ status: "ok", uptime: process.uptime() });
});

// Maestro MCP endpoint (placeholder)
// TODO: Register Maestro MCP tools via this endpoint
app.get("/mcp", (c) => {
	return c.json({ tools: [], version: "0.1.0" });
});

// Command chain status endpoint
// TODO: Expose command chain status via this endpoint
app.get("/command-chain/status", (c) => {
	return c.json({ status: "idle", steps: [] });
});

export function startHostService(port: number): void {
	if (server) {
		console.warn("[host-service] Server already running");
		return;
	}

	server = serve(
		{
			fetch: app.fetch,
			port,
			hostname: "127.0.0.1",
		},
		(info) => {
			console.log(`[host-service] Listening on http://127.0.0.1:${info.port}`);
		},
	);

	// Watchdog: restart if the server dies unexpectedly
	const watchdog = setInterval(() => {
		if (!server) {
			console.warn(
				"[host-service] Watchdog detected server death, restarting...",
			);
			startHostService(port);
		}
	}, WATCHDOG_INTERVAL_MS);

	// Graceful shutdown
	const shutdown = () => {
		clearInterval(watchdog);
		if (server) {
			console.log("[host-service] Shutting down...");
			server.close();
			server = null;
		}
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);

	// Safety net: force exit after grace period
	setTimeout(() => {
		if (server) {
			console.error("[host-service] Force exit after grace period");
			process.exit(1);
		}
	}, SHUTDOWN_GRACE_MS);
}

export function stopHostService(): void {
	if (server) {
		server.close();
		server = null;
	}
}
