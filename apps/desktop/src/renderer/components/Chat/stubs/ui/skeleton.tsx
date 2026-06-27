// Stub: @superset/ui/skeleton
import { cn } from "./utils";

export interface SkeletonProps {
  className?: string;
  alwaysRender?: boolean;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
