/**
 * Stub for StatusIcon component (not yet migrated from Superset).
 * Used by IssueLinkCommand and ListTaskStatusesToolCall.
 */

import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type StatusType = "todo" | "in_progress" | "in_review" | "completed" | "canceled" | "blocked";

export interface StatusIconProps {
  type: StatusType;
  className?: string;
  size?: number;
}

export const StatusIcon: ComponentType<StatusIconProps> = (() => null) as unknown as ComponentType<StatusIconProps>;

export const STATUS_LABELS: Record<StatusType, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
  canceled: "Canceled",
  blocked: "Blocked",
};

export const STATUS_ICONS: Record<StatusType, LucideIcon> = {} as Record<StatusType, LucideIcon>;
