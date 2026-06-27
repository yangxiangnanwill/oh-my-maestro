// Stub: @superset/ui/ai-elements/bash-tool
import type { ReactNode } from "react";

export type ToolState = "pending" | "in-progress" | "complete" | "error";

export interface BashToolProps {
  command: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  state?: ToolState;
}

export function BashTool({ command, stdout, stderr, exitCode, state }: BashToolProps) {
  return null;
}
