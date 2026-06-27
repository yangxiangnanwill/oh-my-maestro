import type { registerRoute } from "lib/window-loader";

type Route = Parameters<typeof registerRoute>[0];

/** Window creation props that extend Electron's BrowserWindow options with routing metadata. */
export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route["id"];
  query?: Route["query"];
}

/** A port detected on a running process by the port scanner. */
export interface DetectedPort {
	port: number;
	pid: number;
	processName: string;
	paneId: string;
	workspaceId: string;
	terminalId: string;
	detectedAt: number;
	address: string;
}

/** A detected port enriched with display label and host URL. */
export interface EnrichedPort extends DetectedPort {
	label: string | null;
	hostUrl: string | null;
}

// ============================================================
// Phase 4: Workspace setup types (migrated from Superset shared/types)
// ============================================================

/** Setup configuration for workspace initialization and teardown. */
export interface SetupConfig {
	setup?: string[];
	teardown?: string[];
	run?: string[];
	cwd?: string;
}

/** Local setup configuration overlay with before/after semantics. */
export interface LocalSetupConfig {
	setup?: string[] | { before?: string[]; after?: string[] };
	teardown?: string[] | { before?: string[]; after?: string[] };
	run?: string[] | { before?: string[]; after?: string[] };
}
