import { app } from "electron";

/**
 * Create the app id using the name and author from package.json transformed to kebab case.
 * Falls back to the Electron app name when no explicit id is provided.
 *
 * @param id - Optional explicit app user model ID
 * @returns The app user model ID string
 * @example
 * makeAppId('com.example.app')
 * // => 'com.example.app'
 */
export function makeAppId(id?: string): string {
	return id ?? app.name;
}
