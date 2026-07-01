import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2, Loader2, Plus } from "lucide-react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { useNewWorkspaceModalStore } from "renderer/stores/new-workspace-modal";
import { navigateToWorkspace } from "./utils/workspace-navigation";

function WorkspaceCard({
	id,
	name,
	type,
	isUnread,
	onClick,
}: {
	id: string;
	name: string;
	type: string;
	isUnread: boolean;
	onClick: (id: string) => void;
}) {
	const { t } = useTranslation();
	return (
		<button
			type="button"
			className="group relative flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-accent hover:bg-accent/5"
			onClick={() => onClick(id)}
		>
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				<FolderGit2 className="h-5 w-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-card-foreground">
					{name || t("ui.common.unnamedWorkspace")}
				</p>
				<p className="text-xs text-muted-foreground capitalize">{type}</p>
			</div>
			{isUnread && (
				<span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" />
			)}
		</button>
	);
}

function DashboardPage() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const {
		data: workspaceGroups,
		isLoading,
		error,
	} = electronTrpc.workspaces.getAllGrouped.useQuery();
	const workspaces = workspaceGroups?.flatMap((g) => g.workspaces) ?? [];

	const handleWorkspaceClick = (workspaceId: string) => {
		navigateToWorkspace(workspaceId, navigate);
	};

	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "24px",
				}}
			>
				<div>
					<h1
						style={{
							fontSize: "24px",
							fontWeight: 600,
							margin: "0 0 4px 0",
						}}
					>
						{t("ui.dashboard.title")}
					</h1>
					<p style={{ fontSize: "14px", opacity: 0.5, margin: 0 }}>
						{t("ui.dashboard.yourWorkspaces")}
					</p>
				</div>
				<button
					type="button"
					className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
					onClick={() => useNewWorkspaceModalStore.getState().openModal()}
				>
					<Plus className="h-4 w-4" />
					{t("ui.dashboard.newWorkspace")}
				</button>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>{t("ui.dashboard.loading")}</span>
				</div>
			) : error ? (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<p className="text-sm text-red-500">{t("ui.dashboard.loadError")}</p>
					<p className="max-w-[320px] text-xs text-muted-foreground">
						{error.message}
					</p>
				</div>
			) : workspaces.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<FolderGit2 className="h-12 w-12 text-muted-foreground/40" />
					<p className="text-sm text-muted-foreground">
						{t("ui.dashboard.noWorkspaces")}
					</p>
					<p className="max-w-[240px] text-xs text-muted-foreground/60">
						{t("ui.dashboard.createFirst")}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
					{workspaces.map((ws) => (
						<WorkspaceCard
							key={ws.id}
							id={ws.id}
							name={ws.name}
							type={ws.type}
							isUnread={ws.isUnread}
							onClick={handleWorkspaceClick}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/_dashboard/")({
	component: DashboardPage,
});
