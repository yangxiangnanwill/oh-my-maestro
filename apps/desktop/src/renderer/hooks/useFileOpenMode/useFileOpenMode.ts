import { electronTrpc } from "renderer/lib/electron-trpc";
import type { FileOpenMode } from "main/lib/local-db";
import { DEFAULT_FILE_OPEN_MODE } from "shared/constants";

let cachedFileOpenMode: FileOpenMode = DEFAULT_FILE_OPEN_MODE;

/** Non-React getter, kept in sync by useFileOpenMode(). */
export function getFileOpenMode(): FileOpenMode {
	return cachedFileOpenMode;
}

export function useFileOpenMode(): FileOpenMode {
	const { data } = electronTrpc.settings.getFileOpenMode.useQuery();
	const mode: FileOpenMode = (data as FileOpenMode) ?? DEFAULT_FILE_OPEN_MODE;
	cachedFileOpenMode = mode;
	return mode;
}
