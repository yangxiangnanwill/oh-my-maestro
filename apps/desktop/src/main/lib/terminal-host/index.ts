/**
 * Terminal Host module — barrel export
 *
 * Phase 3: Terminal host daemon client and utilities. Full implementation
 * will be migrated from Superset in Phase 4.
 */

export {
	getTerminalHostClient,
	disposeTerminalHostClient,
} from "./client";

export { HeadlessEmulator } from "./headless-emulator";

// Protocol types
export type {
	HelloRequest,
	HelloResponse,
	CreateOrAttachRequest,
	CreateOrAttachResponse,
	CancelCreateOrAttachRequest,
	WriteRequest,
	ResizeRequest,
	DetachRequest,
	SignalRequest,
	KillRequest,
	KillAllRequest,
	ListSessionsResponse,
	ClearScrollbackRequest,
	ShutdownRequest,
	IpcRequest,
	IpcResponse,
	IpcSuccessResponse,
	IpcErrorResponse,
	IpcEvent,
	TerminalEvent,
	TerminalDataEvent,
	TerminalExitEvent,
	TerminalErrorEvent,
	TerminalSnapshot,
	TerminalModes,
	SessionMeta,
	EmptyResponse,
	RequestTypeMap,
} from "./types";

// PTY Daemon stubs (Phase 4 migration)
export {
	DAEMON_PACKAGE_VERSION,
	Server,
	readSnapshot,
	clearSnapshot,
} from "./pty-daemon-stub";

export type { HandoffMessage } from "./pty-daemon-protocol";
export type { DaemonSnapshot, SnapshotSessionData } from "./pty-daemon-stub";

// Process tree stubs (Phase 4 migration)
export {
	ProcessSignalError,
	signalProcessTargets,
	signalProcessTreeAndGroups,
} from "./process-tree-stub";

export type { ProcessSignalTarget } from "./process-tree-stub";

// Shell ready scanner
export {
	createScanState,
	scanForShellReady,
	SHELLS_WITH_READY_MARKER,
} from "./shell-ready-scanner";

export type { ShellReadyScanState } from "./shell-ready-scanner";
