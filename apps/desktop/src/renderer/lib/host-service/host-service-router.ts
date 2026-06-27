/**
 * Local host-service AppRouter type stub.
 *
 * The full AppRouter is defined by the host-service process (a separate
 * tRPC server). This file provides the type shape used by the renderer
 * client. When the host-service package is integrated, replace this with
 * the actual import from the host-service package.
 *
 * Note: The AppRouter extends AnyRouter so the stub client compiles, but
 * we use `// @ts-expect-error` + runtime casts at call sites because the
 * actual procedure tree shape cannot be expressed on an empty router.
 * Phase 5: Replace with the actual host-service AppRouter type.
 */
import type { AnyRouter } from "@trpc/server";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AppRouter extends AnyRouter {}

/**
 * Runtime procedure shape interfaces used for typed access via
 * getHostServiceClientByUrl. These mirror the actual host-service
 * procedure tree used by the hooks in host-service/.
 */
export interface HostServiceProcedures {
  workspace: {
    get: {
      query: (input: { id: string }) => Promise<WorkspaceInfo | null>;
    };
  };
  git: {
    getStatus: {
      query: (input: {
        workspaceId: string;
        baseBranch?: string;
        priority?: "foreground" | "background";
      }) => Promise<GitStatusResult>;
    };
    getDiff: {
      query: (input: { workspaceId: string; path: string }) => Promise<unknown>;
    };
    getBaseBranch: {
      query: (input: {
        workspaceId: string;
      }) => Promise<{ baseBranch: string | null }>;
    };
  };
  workspaceCleanup: {
    destroy: {
      mutate: (input: {
        workspaceId: string;
        deleteBranch?: boolean;
        force?: boolean;
      }) => Promise<DestroyWorkspaceOutput>;
    };
    inspect: {
      query: (input: {
        workspaceId: string;
      }) => Promise<DestroyWorkspacePreviewOutput>;
    };
  };
  terminalAgents: {
    listByWorkspace: {
      query: (input: {
        workspaceId: string;
      }) => Promise<TerminalAgentBinding[]>;
    };
  };
  terminal: {
    writeInput: {
      mutate: (input: {
        workspaceId: string;
        terminalId: string;
        data: string;
      }) => Promise<void>;
    };
  };
  ports: {
    kill: {
      mutate: (input: {
        workspaceId: string;
        terminalId: string;
        port: number;
      }) => Promise<{ success: boolean; error?: string }>;
    };
  };
  filesystem: {
    listDirectory: {
      query: (input: {
        workspaceId: string;
        absolutePath: string;
      }) => Promise<{ entries: FsEntry[] }>;
    };
  };
}

// ---- Supporting types for the procedure shapes ----

export interface GitStatusFile {
  path: string;
  status: "added" | "modified" | "changed" | "deleted" | "untracked" | "renamed" | "copied";
  additions: number;
  deletions: number;
}

export interface GitStatusResult {
  againstBase: GitStatusFile[];
  staged: GitStatusFile[];
  unstaged: GitStatusFile[];
  ignoredPaths: string[];
}

export interface DestroyWorkspaceOutput {
  success: boolean;
  worktreeRemoved: boolean;
  branchDeleted: boolean;
  cloudDeleted: boolean;
  warnings: string[];
}

export type DestroyWorkspacePreviewOutput =
  | {
      canDelete: true;
      reason: null;
      hasChanges: boolean;
      hasUnpushedCommits: boolean;
    }
  | {
      canDelete: false;
      reason: string;
      hasChanges: false;
      hasUnpushedCommits: false;
    };

export interface TerminalAgentBinding {
  terminalId: string;
  agentId: string;
  [key: string]: unknown;
}

export interface FsEntry {
  absolutePath: string;
  kind: "file" | "directory" | "symlink";
  name: string;
  size: number;
  modifiedAt: number;
}

export interface WorkspaceInfo {
  id: string;
  worktreePath: string | null;
}
