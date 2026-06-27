// Stub: @superset/ui/tooltip
import { type ReactNode, useState } from "react";

export interface TooltipProps {
  children: ReactNode;
  content?: ReactNode;
  delayDuration?: number;
  openDelay?: number;
  closeDelay?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function TooltipContent({ children, side, sideOffset, align, alignOffset, showArrow }: {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
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
