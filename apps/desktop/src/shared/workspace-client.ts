/**
 * Stub for @superset/workspace-client.
 *
 * primeRelayAffinity is a pre-flight HTTP request that locks fly's edge
 * affinity before the WebSocket upgrade. In oh-my-maestro, this is a no-op
 * since we don't use fly.io relay infrastructure.
 */

/**
 * Pre-flight an HTTP request to lock fly's edge affinity to the owning
 * machine before the WS upgrade. No-op in oh-my-maestro.
 */
export async function primeRelayAffinity(_wsUrl: string): Promise<void> {
	// No-op: oh-my-maestro does not use fly.io relay infrastructure.
	// The connect() function in terminal-ws-transport.ts calls this only
	// for URLs with /hosts/ path prefix, which are not used in this app.
}
