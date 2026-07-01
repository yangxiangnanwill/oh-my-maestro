/**
 * External app + terminal preset type definitions (shared layer).
 *
 * Extracted from main/lib/local-db/index.ts so renderer code can import these
 * without pulling in the main-process local-db module (dependency direction:
 * renderer → shared, never renderer → main).
 *
 * Main-side consumers continue to import these from "@main/lib/local-db",
 * which re-exports them from here for backward compatibility.
 */

export const EXTERNAL_APPS = [
	"finder",
	"vscode",
	"vscode-insiders",
	"cursor",
	"antigravity",
	"devin",
	"zed",
	"xcode",
	"iterm",
	"warp",
	"terminal",
	"ghostty",
	"sublime",
	"intellij",
	"webstorm",
	"pycharm",
	"phpstorm",
	"rubymine",
	"goland",
	"clion",
	"rider",
	"datagrip",
	"appcode",
	"fleet",
	"rustrover",
	"android-studio",
] as const;

export type ExternalApp = (typeof EXTERNAL_APPS)[number];

export const NON_EDITOR_APPS: ExternalApp[] = [
	"finder",
	"iterm",
	"warp",
	"terminal",
	"ghostty",
];

export const EXECUTION_MODES = [
	"new-tab",
	"new-tab-split-pane",
	"split-pane",
	"sequential",
] as const;

export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export interface TerminalPreset {
	id: string;
	name: string;
	description?: string;
	cwd: string;
	commands: string[];
	projectIds: string[] | null;
	pinnedToBar?: boolean;
	useAsWorkspaceRun?: boolean;
	executionMode: ExecutionMode;
	applyOnWorkspaceCreated?: boolean;
	applyOnNewTab?: boolean;
}
