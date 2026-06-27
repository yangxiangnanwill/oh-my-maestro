/**
 * Keyboard key display component.
 * Renders a single keycap-style element for displaying keyboard shortcuts.
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border bg-muted px-1 text-[10px] font-medium text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </kbd>
  );
}
