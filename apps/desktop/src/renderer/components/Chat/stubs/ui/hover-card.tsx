// Stub: @superset/ui/hover-card
import { type ReactNode } from "react";

export function HoverCard({ children, openDelay }: { children: ReactNode; openDelay?: number }) {
  return <>{children}</>;
}

export function HoverCardTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function HoverCardContent({ children, className, align, side }: {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}) {
  return <div className={className}>{children}</div>;
}
