// Phase 3 stub — will be replaced by Phase 4 implementation
// Original depends on: @main/lib/local-db, shared/host-info-types, shared/env.shared,
// lib/trpc/routers/workspaces/utils/shell-env, ./relay-url, ./host-service-manifest, etc.

import { EventEmitter } from "node:events";
import type {
	HostServiceStatus,
	Connection,
	HostServiceStartOpts,
	HostServiceRestartOpts,
	HostServiceResetOpts,
} from "shared/host-info-types";

export class HostServiceCoordinator extends EventEmitter {
	// Phase 4: implement full coordinator logic

	async start(
		_organizationId: string,
		_opts: HostServiceStartOpts,
	): Promise<void> {
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

	async restart(
		_organizationId: string,
		_opts: HostServiceRestartOpts,
	): Promise<void> {
		// Phase 4 stub
	}

	async reset(
		_organizationId: string,
		_opts: HostServiceResetOpts,
	): Promise<void> {
		// Phase 4 stub
	}

	getActiveOrganizationIds(): string[] {
		// Phase 4 stub
		return [];
	}

	async restartAll(_opts?: HostServiceRestartOpts): Promise<void> {
		// Phase 4 stub
	}

	stopAll(): void {
		// Phase 4 stub
	}

	enableDevReload(
		_getAuthHeaders: () => Promise<{
			authToken: string;
			cloudApiUrl: string;
		} | null>,
	): void {
		// Phase 4 stub
	}
}

let instance: HostServiceCoordinator | null = null;

export function getHostServiceCoordinator(): HostServiceCoordinator {
	// Phase 4: return singleton instance
	if (!instance) {
		instance = new HostServiceCoordinator();
	}
	return instance;
}

export function getHostId(): string {
	// Phase 4 stub — returns a placeholder machine ID
	return "maestro-desktop";
}
