// Stub: @superset/ui/collapsible
import { type ReactNode } from "react";

export function Collapsible({ children, open, onOpenChange }: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return <>{children}</>;
}

export function CollapsibleTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function CollapsibleContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
