/**
 * Host service type definitions (shared layer).
 *
 * Phase 3: 从 host-service-coordinator.ts 提取纯类型定义到 shared/，
 * 避免 tsconfig paths 将 @superset/shared/host-info 映射到 main/ 层。
 * Phase 4: 将 coordinator 实现迁移后，更新 tsconfig paths 指向此文件。
 */

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
