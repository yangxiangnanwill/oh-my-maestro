// Stub: @superset/ui/tooltip
import { type ReactNode, useState } from "react";

export interface TooltipProps {
  children: ReactNode;
  content?: ReactNode;
  delayDuration?: number;
}

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children, side, showArrow }: {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  showArrow?: boolean;
}) {
  const [visible] = useState(false);
  if (!visible) return null;
  return (
    <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
      {children}
    </div>
  );
}
