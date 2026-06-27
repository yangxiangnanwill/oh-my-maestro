// Stub: @superset/ui/popover
import { type ReactNode, useState } from "react";

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
  children?: ReactNode;
}

export function Popover({ children }: PopoverProps) {
  return <>{children}</>;
}

export function PopoverTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function PopoverAnchor({ children, virtualRef, asChild }: { children: ReactNode; virtualRef?: React.RefObject<Element>; asChild?: boolean }) {
  return <>{children}</>;
}

export function PopoverContent({
  children,
  className,
  side,
  sideOffset,
  align,
  alignOffset,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onEscapeKeyDown,
  onWheel,
  forceMount,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onMouseDown,
}: {
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  onPointerDownOutside?: () => void;
  onFocusOutside?: (e: any) => void;
  onInteractOutside?: (e: any) => void;
  onEscapeKeyDown?: () => void;
  onWheel?: (e: any) => void;
  forceMount?: boolean;
  onOpenAutoFocus?: (e: any) => void;
  onCloseAutoFocus?: (e: any) => void;
  onMouseDown?: (e: any) => void;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
