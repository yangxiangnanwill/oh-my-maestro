/**
 * Type stubs for @superset/workspace-fs/client types used by host-service hooks.
 *
 * These types are used by useFileTree and useWorkspaceEvent hooks for
 * filesystem entry and watch event types.
 *
 * Phase 5: Replace with actual workspace-fs package when integrated.
 */

/** Kind of a filesystem entry. */
export type FsEntryKind = "file" | "directory" | "symlink";

/** A filesystem entry returned by the host-service filesystem API. */
export interface FsEntry {
	absolutePath: string;
	kind: FsEntryKind;
	name: string;
	size: number;
	modifiedAt: number;
}

/** Base fields common to most FsWatchEvent variants. */
interface FsWatchEventBase {
	kind: string;
	absolutePath?: string;
	oldAbsolutePath?: string;
	isDirectory?: boolean;
}

/** A filesystem watch event emitted by the host-service event bus. */
export type FsWatchEvent =
	| {
			kind: "create";
			absolutePath: string;
			isDirectory: boolean;
	  }
	| {
			kind: "update";
			absolutePath: string;
			isDirectory: boolean;
	  }
	| {
			kind: "delete";
			absolutePath: string;
			isDirectory: boolean;
	  }
	| {
			kind: "rename";
			absolutePath: string;
			oldAbsolutePath: string;
			isDirectory: boolean;
	  }
	| {
			kind: "overflow";
	  };
