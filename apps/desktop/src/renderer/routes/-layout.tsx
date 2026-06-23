import { Alerter } from "@superset/ui/atoms/Alert";
import type { ReactNode } from "react";
import { PostHogSurfaceTagger } from "renderer/components/PostHogSurfaceTagger";
import { PostHogUserIdentifier } from "renderer/components/PostHogUserIdentifier";
import { TelemetrySync } from "renderer/components/TelemetrySync";
import { ThemedToaster } from "renderer/components/ThemedToaster";
import { TranslationProvider } from "renderer/contexts/TranslationContext";
import { AuthProvider } from "renderer/providers/AuthProvider";
import { ElectronTRPCProvider } from "renderer/providers/ElectronTRPCProvider";
import { PostHogProvider } from "renderer/providers/PostHogProvider";

export function RootLayout({ children }: { children: ReactNode }) {
	return (
		<PostHogProvider>
			<ElectronTRPCProvider>
				<PostHogUserIdentifier />
				<PostHogSurfaceTagger />
				<TelemetrySync />
				<AuthProvider>
					<TranslationProvider>{children}</TranslationProvider>
					<ThemedToaster />
					<Alerter />
				</AuthProvider>
			</ElectronTRPCProvider>
		</PostHogProvider>
	);
}
