// Stub: @superset/ui/ai-elements/model-selector
import type { ReactNode } from "react";

export interface ModelSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function ModelSelector({ children }: ModelSelectorProps) {
  return <>{children}</>;
}

export function ModelSelectorTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function ModelSelectorContent({ children, title }: { children: ReactNode; title?: string }) {
  return <>{children}</>;
}

export function ModelSelectorInput({ placeholder }: { placeholder?: string }) {
  return null;
}

export function ModelSelectorList({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function ModelSelectorEmpty({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function ModelSelectorLogo({ provider }: { provider: string }) {
  return null;
}

export function ModelSelectorItem({ children, onSelect, value }: {
  children: ReactNode;
  onSelect?: () => void;
  value?: string;
}) {
  return <>{children}</>;
}

export function ModelSelectorGroup({ children, heading }: { children: ReactNode; heading?: string }) {
  return <div>{children}</div>;
}
