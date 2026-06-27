import { randomUUID } from "node:crypto";
import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { app } from "electron";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { env } from "../../env.main";
import {
	ensureMaestroHomeDirExists,
	MAESTRO_HOME_DIR,
	MAESTRO_SENSITIVE_FILE_MODE,
} from "../app-environment";

// ============================================================
// Phase 4: Schema table definitions
// ============================================================

export const projects = sqliteTable("projects", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	name: text("name").notNull(),
	mainRepoPath: text("main_repo_path").notNull(),
	worktreeBaseDir: text("worktree_base_dir"),
	configToastDismissed: integer("config_toast_dismissed", { mode: "boolean" }).default(false),
	defaultApp: text("default_app"),
	tabOrder: integer("tab_order").notNull(),
	lastOpenedAt: integer("last_opened_at").notNull().$defaultFn(() => Date.now()),
	// Phase 4: columns migrated from Superset for projects router
	color: text("color").notNull(),
	defaultBranch: text("default_branch"),
	branchPrefixMode: text("branch_prefix_mode"),
	branchPrefixCustom: text("branch_prefix_custom"),
	workspaceBaseBranch: text("workspace_base_branch"),
	hideImage: integer("hide_image", { mode: "boolean" }),
	iconUrl: text("icon_url"),
	githubOwner: text("github_owner"),
	neonProjectId: text("neon_project_id"),
});

export type SelectProject = typeof projects.$inferSelect;

export const BRANCH_PREFIX_MODES = [
	"author",
	"custom",
	"none",
] as const;

export type BranchPrefixMode = (typeof BRANCH_PREFIX_MODES)[number];

export const settings = sqliteTable("settings", {
	id: integer("id").primaryKey(),
	defaultEditor: text("default_editor"),
	// Phase 4: column migrated from Superset
	lastActiveWorkspaceId: text("last_active_workspace_id"),
	// Phase 4: additional columns for workspaces router
	branchPrefixMode: text("branch_prefix_mode"),
	branchPrefixCustom: text("branch_prefix_custom"),
	worktreeBaseDir: text("worktree_base_dir"),
	terminalPresets: text("terminal_presets", { mode: "json" }),
	terminalPresetsInitialized: integer("terminal_presets_initialized", { mode: "boolean" }),
	agentPresetOverrides: text("agent_preset_overrides", { mode: "json" }),
	agentPresetPermissionsMigratedAt: integer("agent_preset_permissions_migrated_at"),
	agentCustomDefinitions: text("agent_custom_definitions", { mode: "json" }),
	selectedRingtoneId: text("selected_ringtone_id"),
	confirmOnQuit: integer("confirm_on_quit", { mode: "boolean" }),
	exposeHostServiceViaRelay: integer("expose_host_service_via_relay", { mode: "boolean" }),
	// Phase 4: columns migrated from Superset for settings router
	showPresetsBar: integer("show_presets_bar", { mode: "boolean" }),
	useCompactTerminalAddButton: integer("use_compact_terminal_add_button", { mode: "boolean" }),
	terminalLinkBehavior: text("terminal_link_behavior"),
	fileOpenMode: text("file_open_mode"),
	autoApplyDefaultPreset: integer("auto_apply_default_preset", { mode: "boolean" }),
	deleteLocalBranch: integer("delete_local_branch", { mode: "boolean" }),
	showResourceMonitor: integer("show_resource_monitor", { mode: "boolean" }),
	openLinksInApp: integer("open_links_in_app", { mode: "boolean" }),
	notificationSoundsMuted: integer("notification_sounds_muted", { mode: "boolean" }),
	notificationVolume: integer("notification_volume"),
	terminalFontFamily: text("terminal_font_family"),
	terminalFontSize: integer("terminal_font_size"),
	editorFontFamily: text("editor_font_family"),
	editorFontSize: integer("editor_font_size"),
});

export const workspaces = sqliteTable("workspaces", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	projectId: text("project_id").notNull(),
	worktreeId: text("worktree_id"),
	deletingAt: integer("deleting_at"),
	// Phase 4: columns migrated from Superset
	type: text("type"),
	branch: text("branch").notNull(),
	name: text("name").notNull(),
	tabOrder: integer("tab_order").notNull(),
	lastOpenedAt: integer("last_opened_at").notNull().$defaultFn(() => Date.now()),
	updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
	isUnread: integer("is_unread", { mode: "boolean" }),
	isUnnamed: integer("is_unnamed", { mode: "boolean" }),
	// Phase 4: additional columns for sections support
	sectionId: text("section_id"),
	createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
});

export type SelectWorkspace = typeof workspaces.$inferSelect;

// Phase 4: table migrated from Superset
export const workspaceSections = sqliteTable("workspace_sections", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	projectId: text("project_id").notNull(),
	name: text("name").notNull(),
	tabOrder: integer("tab_order").notNull(),
	// Phase 4: columns migrated from Superset for sections
	color: text("color"),
	isCollapsed: integer("is_collapsed", { mode: "boolean" }),
});

export type SelectWorkspaceSection = typeof workspaceSections.$inferSelect;

// Phase 4: table migrated from Superset
export const worktrees = sqliteTable("worktrees", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	projectId: text("project_id").notNull(),
	branch: text("branch").notNull(),
	path: text("path").notNull(),
	baseBranch: text("base_branch"),
	gitStatus: text("git_status", { mode: "json" }).$type<GitStatus | null>(),
	// Phase 4: additional columns for GitHub integration
	githubStatus: text("github_status", { mode: "json" }).$type<GitHubStatus | null>(),
	createdAt: integer("created_at").$defaultFn(() => Date.now()),
	createdBySuperset: integer("created_by_superset", { mode: "boolean" }),
});

export type SelectWorktree = typeof worktrees.$inferSelect;

export const browserHistory = sqliteTable("browser_history", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	url: text("url").notNull().unique(),
	title: text("title").notNull(),
	faviconUrl: text("favicon_url"),
	lastVisitedAt: integer("last_visited_at").notNull(),
	visitCount: integer("visit_count").notNull().default(1),
});

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

// ============================================================
// Phase 4: GitHubStatus type (migrated from Superset @superset/local-db)
// ============================================================

export interface GitHubStatus {
	pr: {
		number: number;
		title: string;
		url: string;
		state: "open" | "closed" | "merged" | "draft";
		additions: number;
		deletions: number;
		reviewDecision: "approved" | "changes_requested" | "pending" | "none";
		checksStatus: "success" | "failure" | "pending" | "none";
		checks: Array<{
			name: string;
			status: string;
			conclusion: string | null;
			url: string | null;
		}>;
		headRefName: string | null;
		headRepositoryOwner: string | null;
		headRepositoryName: string | null;
		isCrossRepository: boolean;
	} | null;
	repoUrl: string;
	upstreamUrl: string;
	isFork: boolean;
	branchExistsOnRemote: boolean;
	previewUrl: string | null;
	lastRefreshed: number;
}

export interface PullRequestComment {
	id: string;
	author: string;
	body: string;
	createdAt: string;
	url: string;
}

export interface CheckItem {
	name: string;
	status: "success" | "failure" | "pending" | "skipped" | "cancelled";
	url?: string | null;
}

export interface GitStatus {
	branch: string;
	needsRebase: boolean;
	ahead: number;
	behind: number;
	lastRefreshed: number;
}

// ============================================================
// Phase 4: Settings router types (migrated from Superset @superset/local-db)
// ============================================================

export const EXECUTION_MODES = [
	"new-tab",
	"new-tab-split-pane",
	"split-pane",
	"sequential",
] as const;

export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const FILE_OPEN_MODES = [
	"tab",
	"window",
	"browser",
] as const;

export type FileOpenMode = (typeof FILE_OPEN_MODES)[number];

export const TERMINAL_LINK_BEHAVIORS = [
	"open-in-app",
	"open-in-browser",
] as const;

export type TerminalLinkBehavior = (typeof TERMINAL_LINK_BEHAVIORS)[number];

export const PROMPT_TRANSPORTS = [
	"argv",
	"stdin",
	"file",
] as const;

export type PromptTransport = (typeof PROMPT_TRANSPORTS)[number];

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

export interface AgentCustomDefinition {
	id: `custom:${string}`;
	kind: "terminal";
	label: string;
	description?: string;
	command: string;
	promptCommand?: string;
	promptCommandSuffix?: string;
	promptTransport?: PromptTransport;
	taskPromptTemplate: string;
	enabled?: boolean;
}

export interface AgentPresetOverrideEnvelope {
	overrides?: Record<string, unknown>;
}

// ============================================================
// Database initialization
// ============================================================

const DB_PATH = join(MAESTRO_HOME_DIR, "local.db");

ensureMaestroHomeDirExists();

/**
 * Gets the migrations directory path.
 *
 * Path resolution strategy:
 * - Production (packaged .app): resources/migrations/
 * - Development (NODE_ENV=development): packages/local-db/drizzle/
 * - Preview (electron-vite preview): dist/resources/migrations/
 * - Test environment: Use monorepo path relative to __dirname
 */
function getMigrationsDirectory(): string {
	// Check if running in Electron (app.getAppPath exists)
	const isElectron =
		typeof app?.getAppPath === "function" &&
		typeof app?.isPackaged === "boolean";

	if (isElectron && app.isPackaged) {
		return join(process.resourcesPath, "resources/migrations");
	}

	const isDev = env.NODE_ENV === "development";

	if (isElectron && isDev) {
		// Development: source files in monorepo
		return join(app.getAppPath(), "../../packages/local-db/drizzle");
	}

	// Preview mode or test: __dirname is dist/main, so go up one level to dist/resources/migrations
	const previewPath = join(__dirname, "../resources/migrations");
	if (existsSync(previewPath)) {
		return previewPath;
	}

	// Fallback: try monorepo path (for tests or dev without Electron)
	// From apps/desktop/src/main/lib/local-db -> packages/local-db/drizzle
	const monorepoPath = join(
		__dirname,
		"../../../../../packages/local-db/drizzle",
	);
	if (existsSync(monorepoPath)) {
		return monorepoPath;
	}

	// Try Electron app path if available
	if (isElectron) {
		const srcPath = join(app.getAppPath(), "../../packages/local-db/drizzle");
		if (existsSync(srcPath)) {
			return srcPath;
		}
	}

	console.warn(`[local-db] Migrations directory not found at: ${previewPath}`);
	return previewPath;
}

const migrationsFolder = getMigrationsDirectory();

const sqlite = new Database(DB_PATH);
try {
	chmodSync(DB_PATH, MAESTRO_SENSITIVE_FILE_MODE);
} catch {
	// Best-effort; directory permissions should still protect the DB.
}
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF");
sqlite.function("uuid_v4", () => randomUUID());
sqlite.function("uuid_is_valid_v4", (value: unknown) => {
	if (typeof value !== "string") return 0;
	if (!uuidValidate(value)) return 0;
	return uuidVersion(value) === 4 ? 1 : 0;
});

console.log(`[local-db] Database initialized at: ${DB_PATH}`);
console.log(`[local-db] Running migrations from: ${migrationsFolder}`);

export const localDb: ReturnType<typeof drizzle> = drizzle(sqlite, {
	schema: {
		projects,
		settings,
		workspaces,
		workspaceSections,
		worktrees,
		browserHistory,
	},
});

try {
	migrate(localDb, { migrationsFolder });
} catch (error) {
	console.warn("[local-db] Migration skipped (no migration files found):", error instanceof Error ? error.message : error);
}

console.log("[local-db] Migrations complete");

export type LocalDb = typeof localDb;
