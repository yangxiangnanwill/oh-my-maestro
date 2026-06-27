// Stub: @superset/ui/sonner
import type { ReactNode } from "react";

interface ToastOptions {
  description?: string | ReactNode;
  duration?: number;
}

export function toast(message: string, options?: ToastOptions) {
  // Minimal stub - logs to console
  console.log(`[Toast] ${message}`, options);
}

toast.success = (message: string, options?: ToastOptions) => {
  console.log(`[Toast Success] ${message}`, options);
};

toast.error = (message: string, options?: ToastOptions) => {
  console.error(`[Toast Error] ${message}`, options);
};

toast.dismiss = () => {};

export interface ToasterProps {
  expand?: boolean;
  theme?: string;
}

export function Toaster(_props: ToasterProps) {
  return null;
}
