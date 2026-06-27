// Stub: @superset/ui/ai-elements/web-search-tool
import type { ReactNode } from "react";

export type ToolState = "pending" | "in-progress" | "complete" | "error";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchToolProps {
  query: string;
  results: WebSearchResult[];
  state?: ToolState;
}

export function WebSearchTool({ query, results, state }: WebSearchToolProps) {
  return null;
}
