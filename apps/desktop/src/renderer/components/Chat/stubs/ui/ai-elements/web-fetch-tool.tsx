// Stub: @superset/ui/ai-elements/web-fetch-tool
import type { ReactNode } from "react";

export type ToolState = "pending" | "in-progress" | "complete" | "error" | "input-streaming" | "input-available" | "output-available" | "output-error";

export interface WebFetchToolProps {
  url: string;
  content?: string;
  bytes?: number;
  statusCode?: number;
  state?: ToolState;
}

export function WebFetchTool({ url, content, bytes, statusCode, state }: WebFetchToolProps) {
  return null;
}
