import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "renderer/contexts/TranslationContext";

function SettingsPage() {
	const { t } = useTranslation();
	return (
		<div style={{ padding: "32px" }}>
			<h1
				style={{
					fontSize: "24px",
					fontWeight: 600,
					margin: "0 0 8px 0",
					color: "var(--foreground, #e0e0e0)",
				}}
			>
				{t("ui.settings.title")}
			</h1>
			<p style={{ fontSize: "14px", opacity: 0.5, margin: 0 }}>
				{t("ui.settings.placeholder")}
			</p>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/settings/")({
	component: SettingsPage,
});
