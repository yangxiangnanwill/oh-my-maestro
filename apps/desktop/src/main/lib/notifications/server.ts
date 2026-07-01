// Phase 4 stub: main/lib/notifications/server
// Migrated from Superset notifications server module

import { EventEmitter } from "node:events";

export interface AgentLifecycleEvent {
	sessionId: string;
	eventType: string;
	paneId?: string;
	tabId?: string;
	workspaceId?: string;
}

export interface NotificationIds {
	paneId?: string;
	tabId?: string;
	workspaceId?: string;
}

export const notificationsEmitter = new EventEmitter();
