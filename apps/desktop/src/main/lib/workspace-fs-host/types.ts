// Stub types for @superset/workspace-fs/host
// Full implementation will be added in a later phase.

import type { WatchPathEventBatch as InternalWatchPathEventBatch } from "../fs-watcher-manager";

export type WatchPathEventBatch = InternalWatchPathEventBatch;

export interface FsHostService {
  listDirectory(params: { absolutePath: string }): Promise<{
    entries: Array<{
      name: string;
      kind: "file" | "directory" | "symlink";
      relativePath: string;
    }>;
  }>;
  readFile(params: {
    absolutePath: string;
    offset?: number;
    maxBytes?: number;
    encoding?: string;
  }): Promise<
    | { kind: "text"; content: string }
    | { kind: "bytes"; content: Uint8Array }
  >;
  getMetadata(params: { absolutePath: string }): Promise<{
    size: number;
    modifiedAt: number;
    createdAt: number;
    kind: "file" | "directory" | "symlink";
  }>;
  writeFile(params: {
    absolutePath: string;
    content: string | Uint8Array;
    encoding?: string;
    options?: { create: boolean; overwrite: boolean };
    precondition?: { ifMatch: string };
  }): Promise<{ ifMatch: string }>;
  createDirectory(params: {
    absolutePath: string;
    recursive?: boolean;
  }): Promise<void>;
  deletePath(params: {
    absolutePath: string;
    permanent?: boolean;
  }): Promise<void>;
  movePath(params: {
    sourceAbsolutePath: string;
    destinationAbsolutePath: string;
  }): Promise<void>;
  copyPath(params: {
    sourceAbsolutePath: string;
    destinationAbsolutePath: string;
  }): Promise<void>;
  searchFiles(params: {
    query: string;
    includeHidden?: boolean;
    includePattern?: string;
    excludePattern?: string;
    limit?: number;
  }): Promise<{ matches: Array<{ absolutePath: string; relativePath: string }> }>;
  searchContent(params: {
    query: string;
    includeHidden?: boolean;
    includePattern?: string;
    excludePattern?: string;
    limit?: number;
  }): Promise<{ matches: Array<{ absolutePath: string; relativePath: string; line: number; column: number; match: string }> }>;
  watchPath(params: {
    absolutePath: string;
    recursive?: boolean;
  }): AsyncIterable<WatchPathEventBatch>;
}

export interface WorkspaceFsPathError extends Error {
  code: string;
  path: string;
}
