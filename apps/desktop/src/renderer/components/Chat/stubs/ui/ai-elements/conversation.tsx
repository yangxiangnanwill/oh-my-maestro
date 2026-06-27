// Stub: @superset/ui/ai-elements/conversation
import type { ReactNode } from "react";

export interface ConversationProps {
  children?: ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  return <div className={className}>{children}</div>;
}

export function ConversationContent({ children, className }: ConversationProps) {
  return <div className={className}>{children}</div>;
}

export function ConversationEmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ConversationScrollButton() {
  return null;
}

export function useConversationContext() {
  return { scrollToBottom: () => {} };
}
