import type { BrowserWindowConstructorOptions } from "electron";
import { BrowserWindow } from "electron";

export interface CreateWindowOptions extends BrowserWindowConstructorOptions {
	id: string;
}

/**
 * Creates a new Electron BrowserWindow with the given options.
 * Stub — will be enhanced with additional features (menu, traffic lights, etc.) in Phase 4.
 */
export function createWindow(options: CreateWindowOptions): BrowserWindow {
	const { id, ...windowOptions } = options;
	const win = new BrowserWindow(windowOptions);
	// Store the window id for later lookup
	(win as BrowserWindow & { _maestroId: string })._maestroId = id;
	return win;
}
