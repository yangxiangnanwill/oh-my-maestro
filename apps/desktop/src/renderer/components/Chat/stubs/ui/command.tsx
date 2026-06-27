// Stub: @superset/ui/command
import { type ReactNode } from "react";

export interface CommandProps {
  children?: ReactNode;
  className?: string;
  shouldFilter?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Command({ children, className }: CommandProps) {
  return <div className={className}>{children}</div>;
}

export function CommandInput({ placeholder, className, value, onValueChange }: {
  placeholder?: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return null;
}

export function CommandList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CommandEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return <>{children}</>;
}

export function CommandGroup({ children, heading, className, forceMount }: {
  children: ReactNode;
  heading?: string;
  className?: string;
  forceMount?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

export function CommandItem({ children, onSelect, className, value, forceMount, onMouseDown, disabled }: {
  children: ReactNode;
  onSelect?: (value: string) => void;
  className?: string;
  value?: string;
  forceMount?: boolean;
  onMouseDown?: (e: any) => void;
  disabled?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

export function CommandSeparator({ className, alwaysRender }: { className?: string; alwaysRender?: boolean }) {
  return <hr className={className} />;
}

export function CommandShortcut({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}

export function CommandDialog({ children, open, onOpenChange, defaultOpen }: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}) {
  return <>{children}</>;
}
