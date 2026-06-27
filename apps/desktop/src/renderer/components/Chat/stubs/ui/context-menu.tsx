// Stub: @superset/ui/context-menu
import { type ReactNode } from "react";

export interface ContextMenuProps {
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function ContextMenu({ children }: ContextMenuProps) {
  return <>{children}</>;
}

export function ContextMenuTrigger({
  children,
  asChild,
  onContextMenuCapture,
}: {
  children: ReactNode;
  asChild?: boolean;
  onContextMenuCapture?: (event: React.MouseEvent) => void;
}) {
  return <>{children}</>;
}

export function ContextMenuContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function ContextMenuItem({
  children,
  disabled,
  onSelect,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function ContextMenuSeparator({
  className,
}: {
  className?: string;
}) {
  return <hr className={className} />;
}

export function ContextMenuShortcut({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}
