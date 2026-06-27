// Phase 3 stub — will be replaced by Phase 4 implementation
// Original depends on: @superset/local-db, @superset/shared/host-info, shared/env.shared,
// lib/trpc/routers/workspaces/utils/shell-env, ./relay-url, ./host-service-manifest, etc.

import { EventEmitter } from "node:events";

export type HostServiceStatus = "starting" | "running" | "stopped";

export interface HostServiceStatusEvent {
  status: HostServiceStatus;
  organizationId: string;
  error?: string;
}

export interface Connection {
  port: number;
  secret: string;
}

export interface HostServiceStartOpts {
  authToken: string;
  cloudApiUrl: string;
}

export interface HostServiceRestartOpts {
  authToken: string;
  cloudApiUrl: string;
}

export interface HostServiceResetOpts {
  authToken: string;
  cloudApiUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HostServiceCoordinatorEvents {
  // Phase 4: define events
}

export class HostServiceCoordinator extends EventEmitter {
  // Phase 4: implement full coordinator logic

  async start(_organizationId: string, _opts: HostServiceStartOpts): Promise<void> {
    // Phase 4 stub
  }

  getConnection(_organizationId: string): Connection | undefined {
    // Phase 4 stub
    return undefined;
  }

  getProcessStatus(_organizationId: string): HostServiceStatus {
    // Phase 4 stub
    return "stopped";
  }

  async restart(_organizationId: string, _opts: HostServiceRestartOpts): Promise<void> {
    // Phase 4 stub
  }

  async reset(_organizationId: string, _opts: HostServiceResetOpts): Promise<void> {
    // Phase 4 stub
  }

  getActiveOrganizationIds(): string[] {
    // Phase 4 stub
    return [];
  }

  async restartAll(_opts?: HostServiceRestartOpts): Promise<void> {
    // Phase 4 stub
  }
}

export function getHostServiceCoordinator(): HostServiceCoordinator {
  // Phase 4: return singleton instance
  return new HostServiceCoordinator();
}

export function getHostId(): string {
  // Phase 4 stub — returns a placeholder machine ID
  return "maestro-desktop";
}
