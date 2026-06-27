// Stub: @superset/ui/ai-elements/tool
import type { ReactNode } from "react";

export type ToolDisplayState = "pending" | "in-progress" | "complete" | "error" | "input-streaming" | "input-complete" | "output-error" | "output-available" | "input-available";

export interface ToolInputProps {
  children?: ReactNode;
  label?: string;
  input?: Record<string, unknown> | {};
}

export function ToolInput({ children, label }: ToolInputProps) {
  return <div>{children}</div>;
}

export interface ToolOutputProps {
  children?: ReactNode;
  label?: string;
  output?: unknown;
  errorText?: string;
}

export function ToolOutput({ children, label }: ToolOutputProps) {
  return <div>{children}</div>;
}
