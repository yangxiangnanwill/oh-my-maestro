// Stub: @superset/ui/ai-elements/plan
import type { ReactNode } from "react";

export interface PlanProps {
  children?: ReactNode;
  title?: string;
  description?: string;
}

export function Plan({ children, title, description }: PlanProps) {
  return <div>{children}</div>;
}

export function PlanStep({ children, title, status }: {
  children?: ReactNode;
  title?: string;
  status?: "pending" | "in-progress" | "complete";
}) {
  return <div>{children}</div>;
}
