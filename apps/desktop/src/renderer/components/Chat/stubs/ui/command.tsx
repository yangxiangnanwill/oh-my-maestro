// Stub: @superset/ui/command
import { type ReactNode } from "react";

export interface CommandProps {
  children?: ReactNode;
  className?: string;
  shouldFilter?: boolean;
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

export function CommandEmpty({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function CommandGroup({ children, heading, className }: {
  children: ReactNode;
  heading?: string;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function CommandItem({ children, onSelect, className, value }: {
  children: ReactNode;
  onSelect?: (value: string) => void;
  className?: string;
  value?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function CommandSeparator({ className }: { className?: string }) {
  return <hr className={className} />;
}

export function CommandShortcut({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}
