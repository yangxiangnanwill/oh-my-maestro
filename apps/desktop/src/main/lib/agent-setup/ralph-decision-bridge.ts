/**
 * Ralph Decision Bridge — bridges Maestro-flow Ralph decision engine events
 * into the Superset Agent lifecycle hooks.
 *
 * Architecture:
 *   Maestro-flow Ralph Engine
 *     -> WebSocket (ws://localhost:{port}/ralph/decisions)
 *        -> ralph-decision-bridge.ts (this file)
 *           -> Agent Hook callbacks
 *              -> notify.sh -> Agent state change
 *
 * Fallback: If WebSocket is unavailable, watches `decision-events.json`
 * file for changes using fs.watch (polling-based fallback).
 *
 * Event mapping (Adapter Pattern):
 *   decision-node-created  -> onDecisionRequired({nodeId, question, options})
 *   decision-node-resolved -> onDecisionResolved({nodeId, selectedOption})
 *   decision-node-expired  -> onDecisionExpired({nodeId})
 */

import { readFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import os from "node:os";
import { getWebSocketEventBus } from "../websocket-event-bus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Decision node as emitted by Ralph decision engine. */
export interface RalphDecisionNode {
	id: string;
	label: string;
	question: string;
	options: string[];
	selectedOption?: string;
	resolved: boolean;
	/** ISO 8601 timestamp of creation */
	createdAt?: string;
	/** ISO 8601 timestamp of expiry (if applicable) */
	expiresAt?: string;
}

/** Payload for onDecisionRequired hook. */
export interface DecisionRequiredPayload {
	nodeId: string;
	question: string;
	options: string[];
	label?: string;
}

/** Payload for onDecisionResolved hook. */
export interface DecisionResolvedPayload {
	nodeId: string;
	selectedOption: string;
}

/** Payload for onDecisionExpired hook. */
export interface DecisionExpiredPayload {
	nodeId: string;
}

/** Decision event types from Ralph engine. */
type DecisionEventType =
	| "decision-node-created"
	| "decision-node-resolved"
	| "decision-node-expired";

/** Raw event from the Ralph decision WebSocket stream. */
interface RalphDecisionEvent {
	type: DecisionEventType;
	node: RalphDecisionNode;
	/** ISO 8601 timestamp */
	timestamp: string;
}

/** Callback hooks that the bridge invokes. */
export interface RalphDecisionHooks {
	onDecisionRequired?: (payload: DecisionRequiredPayload) => void;
	onDecisionResolved?: (payload: DecisionResolvedPayload) => void;
	onDecisionExpired?: (payload: DecisionExpiredPayload) => void;
}

interface BridgeOptions {
	/** WebSocket URL for Ralph decision events. Default: ws://127.0.0.1:51742/ralph/decisions */
	wsUrl?: string;
	/** Path to decision-events.json file for file-watch fallback */
	fallbackFilePath?: string;
	/** Reconnect base delay in ms (exponential backoff). Default: 1000 */
	reconnectBaseDelay?: number;
	/** Max reconnect attempts. Default: 5 */
	maxReconnectAttempts?: number;
	/** Callback hooks */
	hooks?: RalphDecisionHooks;
}

interface BridgeState {
	ws: WebSocket | null;
	reconnectAttempts: number;
	reconnectTimer: ReturnType<typeof setTimeout> | null;
	started: boolean;
	/** Last known decision nodes (for dedup on reconnect) */
	knownNodeIds: Set<string>;
	/** File watcher for fallback mode */
	fileWatcher: ReturnType<typeof watch> | null;
	/** Whether we are in file-watch fallback mode */
	fallbackMode: boolean;
	/** Last file mtime we processed */
	lastFileMtime: number;
}

// ---------------------------------------------------------------------------
// Default options
// ---------------------------------------------------------------------------

const DEFAULT_WS_URL = "ws://127.0.0.1:51742/ralph/decisions";
const DEFAULT_FALLBACK_FILE = path.join(
	os.homedir(),
	".maestro",
	"decision-events.json",
);
const DEFAULT_RECONNECT_BASE_DELAY = 1000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Event adapter — maps Ralph events to Agent hooks
// ---------------------------------------------------------------------------

function mapEventToHook(
	event: RalphDecisionEvent,
	hooks: RalphDecisionHooks,
): void {
	switch (event.type) {
		case "decision-node-created": {
			if (hooks.onDecisionRequired) {
				hooks.onDecisionRequired({
					nodeId: event.node.id,
					question: event.node.question,
					options: event.node.options,
					label: event.node.label,
				});
			}
			break;
		}
		case "decision-node-resolved": {
			if (hooks.onDecisionResolved && event.node.selectedOption) {
				hooks.onDecisionResolved({
					nodeId: event.node.id,
					selectedOption: event.node.selectedOption,
				});
			}
			break;
		}
		case "decision-node-expired": {
			if (hooks.onDecisionExpired) {
				hooks.onDecisionExpired({
					nodeId: event.node.id,
				});
			}
			break;
		}
		default: {
			console.warn(
				`[ralph-bridge] Unknown decision event type: ${(event as RalphDecisionEvent).type}`,
			);
		}
	}
}

// ---------------------------------------------------------------------------
// File-watch fallback
// ---------------------------------------------------------------------------

/**
 * Read and parse the decision-events.json file.
 * Returns the decision nodes array or null on failure.
 */
async function readDecisionEventsFile(
	filePath: string,
): Promise<RalphDecisionNode[] | null> {
	try {
		const raw = await readFile(filePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);

		if (
			parsed !== null &&
			typeof parsed === "object" &&
			"decisionNodes" in parsed &&
			Array.isArray((parsed as Record<string, unknown>).decisionNodes)
		) {
			return (parsed as { decisionNodes: RalphDecisionNode[] }).decisionNodes;
		}

		if (Array.isArray(parsed)) {
			return parsed as RalphDecisionNode[];
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Process decision nodes from file, invoking hooks for new/updated nodes.
 */
function processFileNodes(
	nodes: RalphDecisionNode[],
	knownNodeIds: Set<string>,
	hooks: RalphDecisionHooks,
): void {
	for (const node of nodes) {
		if (!node.id) continue;

		const isNew = !knownNodeIds.has(node.id);
		const wasUnresolved = knownNodeIds.has(node.id) && !node.resolved;

		if (isNew && !node.resolved) {
			// New decision node created
			knownNodeIds.add(node.id);
			if (hooks.onDecisionRequired) {
				hooks.onDecisionRequired({
					nodeId: node.id,
					question: node.question,
					options: node.options,
					label: node.label,
				});
			}
		} else if (wasUnresolved && node.resolved && node.selectedOption) {
			// Previously unresolved node is now resolved
			if (hooks.onDecisionResolved) {
				hooks.onDecisionResolved({
					nodeId: node.id,
					selectedOption: node.selectedOption,
				});
			}
		}

		// Track all known nodes
		knownNodeIds.add(node.id);
	}
}

// ---------------------------------------------------------------------------
// WebSocket client connection
// ---------------------------------------------------------------------------

function connectWebSocket(
	url: string,
	state: BridgeState,
	hooks: RalphDecisionHooks,
	options: Required<Omit<BridgeOptions, "hooks">>,
): void {
	console.log(`[ralph-bridge] Connecting to Ralph decision stream: ${url}`);

	let ws: WebSocket;
	try {
		ws = new WebSocket(url);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.warn(`[ralph-bridge] WebSocket constructor failed: ${message}`);
		scheduleReconnect(state, hooks, options);
		return;
	}

	state.ws = ws;

	ws.onopen = () => {
		console.log("[ralph-bridge] Connected to Ralph decision stream");
		state.reconnectAttempts = 0;
		state.fallbackMode = false;

		// Subscribe to decision events channel
		ws.send(
			JSON.stringify({
				type: "subscribe",
				channel: "ralph:decisions",
			}),
		);
	};

	ws.onmessage = (event: MessageEvent) => {
		try {
			const data: unknown = JSON.parse(
				typeof event.data === "string" ? event.data : String(event.data),
			);

			// Handle both single event and batch of events
			const events: RalphDecisionEvent[] = Array.isArray(data)
				? (data as RalphDecisionEvent[])
				: [data as RalphDecisionEvent];

			for (const evt of events) {
				if (!evt.type || !evt.node) {
					console.warn("[ralph-bridge] Malformed decision event:", evt);
					continue;
				}

				console.log(
					`[ralph-bridge] Decision event: ${evt.type} node=${evt.node.id}`,
				);

				// Track known nodes for dedup
				if (evt.node.id) {
					state.knownNodeIds.add(evt.node.id);
				}

				mapEventToHook(evt, hooks);
			}
		} catch (err) {
			console.warn("[ralph-bridge] Failed to parse WebSocket message:", err);
		}
	};

	ws.onerror = (err: Event) => {
		console.warn(
			"[ralph-bridge] WebSocket error:",
			err instanceof Error ? err.message : "unknown error",
		);
	};

	ws.onclose = (event: CloseEvent) => {
		console.log(
			`[ralph-bridge] WebSocket closed (code=${event.code}, reason=${event.reason})`,
		);
		state.ws = null;

		// Don't reconnect on normal closure
		if (event.code === 1000) {
			console.log("[ralph-bridge] Normal closure — not reconnecting");
			return;
		}

		scheduleReconnect(state, hooks, options);
	};
}

function scheduleReconnect(
	state: BridgeState,
	hooks: RalphDecisionHooks,
	options: Required<Omit<BridgeOptions, "hooks">>,
): void {
	if (state.reconnectAttempts >= options.maxReconnectAttempts) {
		console.warn(
			`[ralph-bridge] Max reconnect attempts (${options.maxReconnectAttempts}) reached — switching to file-watch fallback`,
		);
		startFileWatchFallback(state, hooks, options);
		return;
	}

	const delay = options.reconnectBaseDelay * 2 ** state.reconnectAttempts;
	state.reconnectAttempts++;

	console.log(
		`[ralph-bridge] Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts}/${options.maxReconnectAttempts})...`,
	);

	state.reconnectTimer = setTimeout(() => {
		connectWebSocket(options.wsUrl, state, hooks, options);
	}, delay);
}

// ---------------------------------------------------------------------------
// File-watch fallback
// ---------------------------------------------------------------------------

function startFileWatchFallback(
	state: BridgeState,
	hooks: RalphDecisionHooks,
	options: Required<Omit<BridgeOptions, "hooks">>,
): void {
	if (state.fallbackMode) {
		return; // Already in fallback mode
	}

	state.fallbackMode = true;
	console.log(
		`[ralph-bridge] Starting file-watch fallback: ${options.fallbackFilePath}`,
	);

	// Initial read
	readDecisionEventsFile(options.fallbackFilePath).then((nodes) => {
		if (nodes) {
			processFileNodes(nodes, state.knownNodeIds, hooks);
		}
	});

	// Watch for changes
	try {
		state.fileWatcher = watch(
			options.fallbackFilePath,
			async (eventType: string) => {
				if (eventType !== "change") return;

				try {
					const fileStat = await stat(options.fallbackFilePath);
					if (fileStat.mtimeMs === state.lastFileMtime) return;
					state.lastFileMtime = fileStat.mtimeMs;
				} catch {
					return; // File may have been deleted
				}

				const nodes = await readDecisionEventsFile(options.fallbackFilePath);
				if (nodes) {
					processFileNodes(nodes, state.knownNodeIds, hooks);
				}
			},
		);

		if (state.fileWatcher && typeof state.fileWatcher.unref === "function") {
			state.fileWatcher.unref();
		}
	} catch (err) {
		console.warn(
			"[ralph-bridge] Failed to set up file watcher:",
			err instanceof Error ? err.message : String(err),
		);
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const bridgeState: BridgeState = {
	ws: null,
	reconnectAttempts: 0,
	reconnectTimer: null,
	started: false,
	knownNodeIds: new Set(),
	fileWatcher: null,
	fallbackMode: false,
	lastFileMtime: 0,
};

/**
 * Create and start the Ralph Decision Bridge.
 *
 * Establishes a WebSocket connection to the Maestro-flow Ralph decision
 * engine event stream. Falls back to file-watch polling if WebSocket is
 * unavailable after max reconnect attempts.
 *
 * Also subscribes to the local WebSocketEventBus on the "ralph:decisions"
 * channel so that in-process events are forwarded to connected UI clients.
 *
 * @param options - Configuration options and hook callbacks
 * @returns The bridge state (for lifecycle management)
 */
export function createRalphDecisionBridge(
	options: BridgeOptions = {},
): BridgeState {
	if (bridgeState.started) {
		console.log("[ralph-bridge] Already started, skipping");
		return bridgeState;
	}

	const resolvedOptions: Required<Omit<BridgeOptions, "hooks">> = {
		wsUrl: options.wsUrl ?? DEFAULT_WS_URL,
		fallbackFilePath: options.fallbackFilePath ?? DEFAULT_FALLBACK_FILE,
		reconnectBaseDelay:
			options.reconnectBaseDelay ?? DEFAULT_RECONNECT_BASE_DELAY,
		maxReconnectAttempts:
			options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
	};

	const hooks: RalphDecisionHooks = options.hooks ?? {};

	// Register default hooks that log decision events
	const effectiveHooks: RalphDecisionHooks = {
		onDecisionRequired: (payload: DecisionRequiredPayload) => {
			console.log(
				`[ralph-bridge] Decision required: node=${payload.nodeId} question="${payload.question}" options=[${payload.options.join(", ")}]`,
			);
			hooks.onDecisionRequired?.(payload);
		},
		onDecisionResolved: (payload: DecisionResolvedPayload) => {
			console.log(
				`[ralph-bridge] Decision resolved: node=${payload.nodeId} selected="${payload.selectedOption}"`,
			);
			hooks.onDecisionResolved?.(payload);
		},
		onDecisionExpired: (payload: DecisionExpiredPayload) => {
			console.log(`[ralph-bridge] Decision expired: node=${payload.nodeId}`);
			hooks.onDecisionExpired?.(payload);
		},
	};

	// Subscribe to local event bus for in-process event forwarding
	try {
		const eventBus = getWebSocketEventBus();
		eventBus.subscribe("ralph:decisions", (event: unknown) => {
			const decisionEvent = event as RalphDecisionEvent;
			if (decisionEvent.type && decisionEvent.node) {
				mapEventToHook(decisionEvent, effectiveHooks);
			}
		});
	} catch (err) {
		console.warn(
			"[ralph-bridge] Failed to subscribe to local event bus:",
			err instanceof Error ? err.message : String(err),
		);
	}

	// Start WebSocket connection
	connectWebSocket(
		resolvedOptions.wsUrl,
		bridgeState,
		effectiveHooks,
		resolvedOptions,
	);

	bridgeState.started = true;
	console.log("[ralph-bridge] Ralph Decision Bridge started");

	return bridgeState;
}

/**
 * Stop the Ralph Decision Bridge. Closes WebSocket connection and
 * cleans up file watchers and timers.
 */
export function stopRalphDecisionBridge(): void {
	if (bridgeState.reconnectTimer) {
		clearTimeout(bridgeState.reconnectTimer);
		bridgeState.reconnectTimer = null;
	}

	if (bridgeState.ws) {
		try {
			bridgeState.ws.close(1000, "Bridge stopped");
		} catch {
			// Best effort
		}
		bridgeState.ws = null;
	}

	if (bridgeState.fileWatcher) {
		try {
			bridgeState.fileWatcher.close();
		} catch {
			// Best effort
		}
		bridgeState.fileWatcher = null;
	}

	bridgeState.knownNodeIds.clear();
	bridgeState.reconnectAttempts = 0;
	bridgeState.started = false;
	bridgeState.fallbackMode = false;

	console.log("[ralph-bridge] Ralph Decision Bridge stopped");
}

/**
 * Get the current bridge state (read-only).
 */
export function getRalphDecisionBridgeState(): Readonly<
	Omit<BridgeState, "reconnectTimer" | "fileWatcher">
> {
	return {
		ws: bridgeState.ws,
		reconnectAttempts: bridgeState.reconnectAttempts,
		started: bridgeState.started,
		knownNodeIds: bridgeState.knownNodeIds,
		fallbackMode: bridgeState.fallbackMode,
		lastFileMtime: bridgeState.lastFileMtime,
	};
}
