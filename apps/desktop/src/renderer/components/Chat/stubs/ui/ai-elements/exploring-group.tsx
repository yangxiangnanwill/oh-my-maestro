// Stub: @superset/ui/ai-elements/exploring-group
import type { ReactNode } from "react";

export interface ExploringGroupProps {
  children?: ReactNode;
  items?: Array<{
    icon: React.ComponentType<{ className?: string }> | React.ForwardRefExoticComponent<any>;
    label: string;
    description?: string;
    status?: string;
    onClick?: () => void;
  }>;
  isStreaming?: boolean;
}

export function ExploringGroup({ children }: ExploringGroupProps) {
  return <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{children}</div>;
}
