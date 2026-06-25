// Phase 3 stub — will be replaced by Phase 4 implementation
// Original depends on: main/env.main, main/index, shared/auto-update, shared/constants

import { EventEmitter } from "node:events";

export const autoUpdateEmitter = new EventEmitter();

export function getUpdateStatus(): { status: string; version?: string } {
  return { status: "IDLE" };
}

export function isUpdateReadyToInstall(): boolean {
  return false;
}

export function installUpdate(): void {}
export function dismissUpdate(): void {}
export function checkForUpdates(): void {}
export function checkForUpdatesInteractive(): void {}
export function simulateUpdateReady(): void {}
export function simulateDownloading(): void {}
export function simulateError(): void {}
export function setupAutoUpdater(): void {}
