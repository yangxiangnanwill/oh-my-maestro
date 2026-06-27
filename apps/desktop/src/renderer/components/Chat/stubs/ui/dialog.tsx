// Stub: @superset/ui/dialog
import { type ReactNode } from "react";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
  children?: ReactNode;
}

export function Dialog({ children }: DialogProps) {
  return <>{children}</>;
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function DialogContent({
  children,
  className,
  showCloseButton,
  onFocusOutside,
  onPointerDownOutside,
  onEscapeKeyDown,
  onInteractOutside,
  forceMount,
}: {
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  onFocusOutside?: (e: any) => void;
  onPointerDownOutside?: () => void;
  onEscapeKeyDown?: () => void;
  onInteractOutside?: (e: any) => void;
  forceMount?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={className}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DialogClose({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
