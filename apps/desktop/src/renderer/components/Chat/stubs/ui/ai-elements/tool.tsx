// Stub: @superset/ui/ai-elements/tool
import type { ReactNode } from "react";

export type ToolDisplayState = "pending" | "in-progress" | "complete" | "error";

export interface ToolInputProps {
  children?: ReactNode;
  label?: string;
}

export function ToolInput({ children, label }: ToolInputProps) {
  return <div>{children}</div>;
}

export interface ToolOutputProps {
  children?: ReactNode;
  label?: string;
}

export function ToolOutput({ children, label }: ToolOutputProps) {
  return <div>{children}</div>;
}
