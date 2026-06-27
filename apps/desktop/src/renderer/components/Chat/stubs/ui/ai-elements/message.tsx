// Stub: @superset/ui/ai-elements/message
import type { ReactNode } from "react";

export const TOOL_CALL_MD_CLASSNAME = "tool-call-md";

export interface MessageProps {
  from: string;
  children?: ReactNode;
}

export function Message({ from, children }: MessageProps) {
  return (
    <div className="flex flex-col gap-2" data-message-role={from}>
      {children}
    </div>
  );
}

export function MessageContent({ children }: { children?: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

export interface MessageResponseProps {
  children?: ReactNode;
  className?: string;
  animated?: boolean;
  isAnimating?: boolean;
  mermaid?: { config?: { theme?: string } };
  components?: Record<string, React.ComponentType<any>>;
}

export function MessageResponse({ children, className }: MessageResponseProps) {
  return <div className={className}>{children}</div>;
}
