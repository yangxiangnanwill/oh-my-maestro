import { Alerter } from "@superset/ui/atoms/Alert";
import type { ReactNode } from "react";
import { ThemedToaster } from "renderer/components/ThemedToaster";
import { TranslationProvider } from "renderer/contexts/TranslationContext";
import { AuthProvider } from "renderer/providers/AuthProvider";
import { ElectronTRPCProvider } from "renderer/providers/ElectronTRPCProvider";

export function RootLayout({ children }: { children: ReactNode }) {
	return (
		<ElectronTRPCProvider>
			<AuthProvider>
				<TranslationProvider>{children}</TranslationProvider>
				<ThemedToaster />
				<Alerter />
			</AuthProvider>
		</ElectronTRPCProvider>
	);
}
