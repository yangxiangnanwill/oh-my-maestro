/**
 * Keyboard key group display component.
 * Renders a group of Kbd elements with a small gap between them.
 */
export function KbdGroup({ children }: { children: React.ReactNode }) {
	return <span className="inline-flex items-center gap-0.5">{children}</span>;
}
