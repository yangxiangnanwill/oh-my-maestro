// Stub: createFsHostService for @superset/workspace-fs/host
// Full implementation will be added in a later phase.

import type { FsHostService } from "./types";
import type { FsWatcherManager } from "./watcher-manager";

export interface FsHostServiceOptions {
  rootPath: string;
  watcherManager: FsWatcherManager;
  trashItem: (absolutePath: string) => Promise<void>;
  runRipgrep: (
    args: string[],
    options: { cwd: string; maxBuffer: number },
  ) => Promise<{ stdout: string }>;
}

export function createFsHostService(
  _options: FsHostServiceOptions,
): FsHostService {
  // Stub implementation — full service will be implemented in a later phase
  throw new Error("createFsHostService not yet implemented");
}
