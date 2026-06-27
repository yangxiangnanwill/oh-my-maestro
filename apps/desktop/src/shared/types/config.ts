/**
 * Configuration-related types for setup/teardown/run scripts.
 */

export interface SetupAction {
	id: string;
	category: string;
	label: string;
	detail: string;
	command: string;
	enabled: boolean;
}

export interface SetupDetectionResult {
	projectSummary: string;
	actions: SetupAction[];
	setupTemplate: string[];
	signals: Record<string, boolean>;
}

export interface SetupConfig {
	setup?: string[];
	teardown?: string[];
	run?: string[];
	cwd?: string;
}

export interface LocalSetupConfig {
	setup?: string[] | { before?: string[]; after?: string[] };
	teardown?: string[] | { before?: string[]; after?: string[] };
	run?: string[] | { before?: string[]; after?: string[] };
}
