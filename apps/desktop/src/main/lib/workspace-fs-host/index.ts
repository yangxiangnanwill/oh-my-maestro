// Stub for @superset/workspace-fs/host
// Provides the host-side filesystem service used by filesystem and workspace-fs-service routers.
// Full implementation will be added in a later phase.

import type { WatchPathEventBatch } from "./types";

export type { WatchPathEventBatch };
export type { FsHostService, WorkspaceFsPathError } from "./types";

export { FsWatcherManager } from "./watcher-manager";
export { createFsHostService } from "./fs-host-service";
export { toRelativePath } from "./path-utils";
export { toErrorMessage } from "./error-utils";
