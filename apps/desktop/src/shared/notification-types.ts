// Phase 4 stub: shared/notification-types
// Migrated from Superset notification types

export interface V2NotificationSourceFocusTarget {
  workspaceId: string;
  source: {
    type: "terminal" | "chat";
    id: string;
  };
}
