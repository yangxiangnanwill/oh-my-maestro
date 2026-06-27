// Stub: @superset/ui/ai-elements/clickable-file-path
import type { ReactNode } from "react";

export interface ClickableFilePathProps {
  filePath: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function ClickableFilePath({ filePath, onClick, children }: ClickableFilePathProps) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-mono text-primary hover:underline">
      {children ?? filePath}
    </button>
  );
}
