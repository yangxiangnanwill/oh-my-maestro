/**
 * Re-export from window-state/ module.
 * The window-state implementation lives in the window-state/ directory module.
 */
export {
	loadWindowState,
	saveWindowState,
	isValidWindowState,
	type WindowState,
} from "./window-state/window-state";
export {
	getInitialWindowBounds,
	isVisibleOnAnyDisplay,
	type InitialWindowBounds,
} from "./window-state/bounds-validation";
