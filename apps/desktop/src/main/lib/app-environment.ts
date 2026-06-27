import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const MAESTRO_DIR_NAME = ".maestro";
const MAESTRO_HOME_DIR_ENV = "MAESTRO_HOME";

export const MAESTRO_HOME_DIR =
	process.env[MAESTRO_HOME_DIR_ENV] || join(homedir(), MAESTRO_DIR_NAME);
process.env[MAESTRO_HOME_DIR_ENV] = MAESTRO_HOME_DIR;

export const MAESTRO_HOME_DIR_MODE = 0o700;
export const MAESTRO_SENSITIVE_FILE_MODE = 0o600;

export function ensureMaestroHomeDirExists(): void {
	if (!existsSync(MAESTRO_HOME_DIR)) {
		mkdirSync(MAESTRO_HOME_DIR, {
			recursive: true,
			mode: MAESTRO_HOME_DIR_MODE,
		});
	}

	// Best-effort repair if the directory already existed with weak permissions.
	try {
		chmodSync(MAESTRO_HOME_DIR, MAESTRO_HOME_DIR_MODE);
	} catch (error) {
		console.warn(
			"[app-environment] Failed to chmod Maestro home dir (best-effort):",
			MAESTRO_HOME_DIR,
			error,
		);
	}
}

// For lowdb - use our own path instead of app.getPath("userData")
export const APP_STATE_PATH = join(MAESTRO_HOME_DIR, "app-state.json");

// Window geometry state (separate from UI state - main process only, sync I/O)
export const WINDOW_STATE_PATH = join(MAESTRO_HOME_DIR, "window-state.json");
