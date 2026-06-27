/**
 * Maestro desktop shared constants.
 * Brand-specific configuration and platform detection.
 */

export const PLATFORM = {
  IS_MAC: process.platform === "darwin",
  IS_LINUX: process.platform === "linux",
  IS_WINDOWS: process.platform === "win32",
} as const;

export const PROTOCOL_SCHEME = "maestro";

export const DEFAULT_CONFIRM_ON_QUIT = true;

// Phase 4: Settings router defaults (migrated from Superset @superset/shared/constants)
export const DEFAULT_AUTO_APPLY_DEFAULT_PRESET = false;
export const DEFAULT_EXPOSE_HOST_SERVICE_VIA_RELAY = false;
export const DEFAULT_FILE_OPEN_MODE = "tab";
export const DEFAULT_OPEN_LINKS_IN_APP = true;
export const DEFAULT_SHOW_PRESETS_BAR = true;
export const DEFAULT_SHOW_RESOURCE_MONITOR = true;
export const DEFAULT_TERMINAL_LINK_BEHAVIOR = "open-in-app";
export const DEFAULT_USE_COMPACT_TERMINAL_ADD_BUTTON = false;

/** Default number of scrollback lines for terminal sessions. */
export const DEFAULT_TERMINAL_SCROLLBACK = 5000;

/** Company / brand configuration used by menus and help links. */
export const COMPANY = {
  DOCS_URL: "https://maestro.sh/docs",
  MAIL_TO: "mailto:hi@maestro.sh",
  REPORT_ISSUE_URL: "https://github.com/maestro-sh/maestro/issues/new",
  DISCORD_URL: "https://discord.gg/maestro",
} as const;

/** Directory name for project-level Maestro configuration. */
export const PROJECT_SUPERSET_DIR_NAME = ".superset";

/** File name for static port labels configuration. */
export const PORTS_FILE_NAME = "ports.json";

/** Supported OAuth authentication providers. */
export const AUTH_PROVIDERS = ["github", "google"] as const;

// ============================================================
// Phase 4: Additional constants for workspaces router
// ============================================================

/** Home directory name for Maestro configuration. */
export const SUPERSET_DIR_NAME = ".superset";

/** Directory name for worktrees. */
export const WORKTREES_DIR_NAME = "worktrees";

/** Directory name for per-project configuration. */
export const PROJECTS_DIR_NAME = "projects";

/** Configuration file name. */
export const CONFIG_FILE_NAME = "config.json";

/** Local configuration file name (user overrides). */
export const LOCAL_CONFIG_FILE_NAME = "config.local.json";

/** Default telemetry enabled flag. */
export const DEFAULT_TELEMETRY_ENABLED = false;

// ============================================================
// Phase 4: Notification event constants
// ============================================================

export const NOTIFICATION_EVENTS = {
  AGENT_LIFECYCLE: "agent-lifecycle",
  FOCUS_TAB: "focus-tab",
  FOCUS_V2_NOTIFICATION_SOURCE: "focus-v2-notification-source",
  TERMINAL_EXIT: "terminal-exit",
} as const;

/** Mock organization ID used in dev mode when SKIP_ENV_VALIDATION is enabled. */
export const MOCK_ORG_ID = "mock-org-id";
