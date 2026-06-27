// Stub: @superset/ui/dropdown-menu
import { type ReactNode } from "react";

export interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <>{children}</>;
}

export function DropdownMenuTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children, className, align }: {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuItem({ children, onSelect, className }: {
  children: ReactNode;
  onSelect?: (event: Event) => void;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, className }: {
  children: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuRadioGroup({ children, value, onValueChange }: {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return <>{children}</>;
}

export function DropdownMenuRadioItem({ children, value, className }: {
  children: ReactNode;
  value: string;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <hr className={className} />;
}

export function DropdownMenuShortcut({ children }: { children: ReactNode }) {
  return <span>{children}</span>;
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuSub({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuSubTrigger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DropdownMenuSubContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
