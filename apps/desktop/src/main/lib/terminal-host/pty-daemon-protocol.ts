/**
 * Stub: @superset/pty-daemon/protocol — Handoff protocol types
 *
 * Phase 3: Minimal stub. Full implementation will be migrated from Superset
 * in a subsequent phase.
 */

export interface HandoffMessage {
	type: "upgrade-ack" | "upgrade-nak";
	reason?: string;
	successorPid?: number;
}
