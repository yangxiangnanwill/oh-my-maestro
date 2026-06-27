// Stub: @superset/ui/select
import { type ReactNode, useState } from "react";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function Select({ children }: SelectProps) {
  return <>{children}</>;
}

export function SelectTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function SelectItem({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  return <div>{children}</div>;
}

export function SelectSeparator() {
  return <hr />;
}
