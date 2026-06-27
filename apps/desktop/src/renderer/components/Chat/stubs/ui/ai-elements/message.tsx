// Stub: @superset/ui/ai-elements/message
import type { ReactNode } from "react";

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

export function MessageResponse({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
