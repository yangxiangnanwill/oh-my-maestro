// Stub: @superset/ui/ai-elements/show-code
import { type ReactNode } from "react";

interface ShowCodeProps {
  className?: string;
  language?: string;
  code?: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
}

export function ShowCode({
  className,
  language,
  code,
  showLineNumbers,
}: ShowCodeProps) {
  return (
    <pre className={className}>
      <code className={language ? `language-${language}` : undefined}>
        {code}
      </code>
    </pre>
  );
}
