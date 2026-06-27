// Stub: @superset/ui/ai-elements/read-file-tool
import type { ReactNode } from "react";

export type ToolState = "pending" | "in-progress" | "complete" | "error";

export interface ReadFileToolProps {
  filePath: string;
  content?: string;
  state?: ToolState;
  onFilePathClick?: () => void;
}

export function ReadFileTool({ filePath, content, state, onFilePathClick }: ReadFileToolProps) {
  return null;
}
