// Phase 3 stub — will be replaced by Phase 4 implementation
// Original depends on: @superset/local-db, @superset/shared/host-info, shared/env.shared,
// lib/trpc/routers/workspaces/utils/shell-env, ./relay-url, ./host-service-manifest, etc.

import { EventEmitter } from "node:events";

export type HostServiceStatus = "starting" | "running" | "stopped";

export interface Connection {
  port: number;
  secret: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HostServiceCoordinatorEvents {
  // Phase 4: define events
}

export class HostServiceCoordinator extends EventEmitter {
  // Phase 4: implement full coordinator logic
}

export function getHostServiceCoordinator(): HostServiceCoordinator {
  // Phase 4: return singleton instance
  return new HostServiceCoordinator();
}
