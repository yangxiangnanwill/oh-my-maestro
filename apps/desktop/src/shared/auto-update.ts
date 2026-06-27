/** Auto-update status states shared between main and renderer processes. */

export const AUTO_UPDATE_STATUS = {
  IDLE: "IDLE",
  CHECKING: "CHECKING",
  DOWNLOADING: "DOWNLOADING",
  READY: "READY",
  ERROR: "ERROR",
} as const;

export type AutoUpdateStatus =
  (typeof AUTO_UPDATE_STATUS)[keyof typeof AUTO_UPDATE_STATUS];
