// Stub: @superset/ui/ai-elements/thinking-toggle
import type { ReactNode } from "react";

export type ThinkingLevel = "low" | "medium" | "high";

export interface ThinkingToggleProps {
  level: ThinkingLevel;
  onLevelChange: (level: ThinkingLevel) => void;
}

export function ThinkingToggle({ level, onLevelChange }: ThinkingToggleProps) {
  return null;
}
