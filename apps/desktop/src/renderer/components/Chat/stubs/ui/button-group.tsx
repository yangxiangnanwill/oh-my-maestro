// Stub: @superset/ui/button-group
import { type ReactNode } from "react";

export interface ButtonGroupProps {
  children?: ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return <div className={className}>{children}</div>;
}
