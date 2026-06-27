// Stub: @superset/ui/ai-elements/file-diff-tool
import type { ReactNode } from "react";

export type ToolState = "pending" | "in-progress" | "complete" | "error";

export interface FileDiffToolProps {
  filePath: string;
  oldString?: string;
  newString?: string;
  content?: string;
  isWriteMode?: boolean;
  structuredPatch?: Array<{ lines: string[] }>;
  onFilePathClick?: () => void;
  renderExpandedContent?: () => ReactNode;
  state?: ToolState;
}

export function FileDiffTool(props: FileDiffToolProps) {
  return null;
}
