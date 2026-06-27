// Stub: @superset/ui/breadcrumb
import { type ReactNode } from "react";

export function Breadcrumb({ children }: { children: ReactNode }) {
  return <nav>{children}</nav>;
}

export function BreadcrumbList({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={className}>{children}</ol>;
}

export function BreadcrumbItem({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={className}>{children}</li>;
}

export function BreadcrumbLink({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function BreadcrumbPage({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}

export function BreadcrumbSeparator() {
  return <span className="mx-1 text-muted-foreground">/</span>;
}

export function BreadcrumbEllipsis() {
  return <span>...</span>;
}
