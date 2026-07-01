// Stub: toRelativePath for @superset/workspace-fs/host
// Full implementation will be added in a later phase.

import path from "node:path";

export function toRelativePath(rootPath: string, absolutePath: string): string {
	return path.relative(rootPath, absolutePath);
}
