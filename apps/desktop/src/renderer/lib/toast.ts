/**
 * Lightweight toast utility replacing @superset/ui/sonner.
 *
 * Provides a minimal toast API compatible with the sonner interface used
 * by host-service-unavailable and workspace auto-name warning toasts.
 * Replace with sonner when that dependency is added to the project.
 */

interface ToastOptions {
	description?: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

type ToastVariant = "error" | "warning" | "info" | "success";

function createToast(variant: ToastVariant) {
	return (message: string, options: ToastOptions = {}) => {
		// Phase 4: wire up to the desktop notification system.
		// For now, log to console so callers compile and the app doesn't crash.
		const prefix = `[${variant.toUpperCase()}]`;
		// eslint-disable-next-line no-console
		console.warn(`${prefix} ${message}`, options.description ?? "");
		if (options.action) {
			// eslint-disable-next-line no-console
			console.warn(`${prefix} Action available: "${options.action.label}"`);
		}
	};
}

export const toast = {
	error: createToast("error"),
	warning: createToast("warning"),
	info: createToast("info"),
	success: createToast("success"),
};
