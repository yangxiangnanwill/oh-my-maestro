/**
 * Stub: @superset/shared/shell-ready-scanner — Shell readiness detection
 *
 * Phase 3: Minimal stub. Detects when a shell has finished initialization
 * and is ready to accept commands, by scanning for a marker in output.
 *
 * Supports both string and Buffer inputs for compatibility with
 * session.ts byte-level scanning.
 */

export interface ShellReadyScanState {
	startTime: number;
	seenPrompt: boolean;
	buffer: string;
	/** Accumulated byte values waiting to be flushed */
	heldBytes: number[];
	/** Current match position in the marker byte sequence */
	matchPos: number;
}

export const SHELLS_WITH_READY_MARKER: ReadonlySet<string> = new Set([
	"bash",
	"zsh",
	"fish",
	"powershell",
	"pwsh",
]);

export function createScanState(): ShellReadyScanState {
	return {
		startTime: Date.now(),
		seenPrompt: false,
		buffer: "",
		heldBytes: [],
		matchPos: 0,
	};
}

export function scanForShellReady(
	_state: ShellReadyScanState,
	_data: string | Buffer | Uint8Array,
): { ready: boolean; matched: boolean; output: Buffer } {
	// Phase 3 stub: no scanning necessary, pass through all data
	const output = Buffer.isBuffer(_data)
		? _data
		: typeof _data === "string"
			? Buffer.from(_data, "utf8")
			: Buffer.from(_data);
	return { ready: false, matched: false, output };
}
