// Stub: @superset/ui/popover
import { type ReactNode, useState } from "react";

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function Popover({ children }: PopoverProps) {
  return <>{children}</>;
}

export function PopoverTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function PopoverAnchor({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function PopoverContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
