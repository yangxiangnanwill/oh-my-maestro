// @ts-nocheck — layout route type pending tsr parent route resolution
import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { useTabsStore } from "renderer/stores/tabs/store";
import { KnowledgePanel } from "renderer/components/KnowledgePanel/KnowledgePanel";
import { RalphPanel } from "renderer/components/RalphPanel";
import { WorkflowStatePanel } from "renderer/components/WorkflowStatePanel";
import { VisualizationPanel } from "renderer/components/VisualizationPanel";
import { DashboardWidget } from "renderer/components/DashboardWidget";
import { WidgetGrid } from "renderer/components/WidgetGrid";

type WorkspaceTab =
	| "overview"
	| "chat"
	| "terminal"
	| "workflow"
	| "visualization"
	| "dashboard";

function WorkspaceLayout() {
	const { t } = useTranslation();
	const { workspaceId } = useParams({ strict: false });
	const tabs = useTabsStore((s) => s.tabs);
	const addChatTab = useTabsStore((s) => s.addChatTab);
	const [showKnowledge, setShowKnowledge] = useState(false);
	const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
	const { data: workspace } = electronTrpc.workspaces.get.useQuery(
		{ id: workspaceId ?? "" },
		{ enabled: Boolean(workspaceId) },
	);
	const workspaceCwd = workspace?.worktreePath ?? "";

	const toggleKnowledge = useCallback(() => {
		setShowKnowledge((prev) => !prev);
	}, []);

	// 获取当前 workspace 的 tabs
	const workspaceTabs = tabs.filter((t) => t.workspaceId === workspaceId);

	const _handleAddChatTab = () => {
		if (workspaceId) {
			addChatTab(workspaceId);
		}
	};

	const handleTabClick = (tab: WorkspaceTab) => {
		if (tab === "chat" && workspaceId && workspaceTabs.length === 0) {
			addChatTab(workspaceId);
		}
		setActiveTab(tab);
	};

	const tabStyle = (tab: WorkspaceTab): React.CSSProperties => ({
		padding: "6px 14px",
		borderRadius: "6px",
		fontSize: "13px",
		background: activeTab === tab ? "var(--accent, #1a1a2e)" : "transparent",
		border: "none",
		color: activeTab === tab ? "var(--accent-foreground, #e0e0e0)" : "inherit",
		cursor: "pointer",
		opacity: activeTab === tab ? 1 : 0.4,
	});

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				background: "var(--background, #0a0a0a)",
				color: "var(--foreground, #e0e0e0)",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			{/* Tab bar */}
			<div
				style={{
					display: "flex",
					gap: "4px",
					padding: "8px 12px",
					borderBottom: "1px solid var(--border, #2a2a2a)",
					flexShrink: 0,
					alignItems: "center",
				}}
			>
				<button
					type="button"
					style={tabStyle("overview")}
					onClick={() => handleTabClick("overview")}
				>
					Overview
				</button>
				<button
					type="button"
					style={tabStyle("chat")}
					onClick={() => handleTabClick("chat")}
				>
					Chat
				</button>
				<button
					type="button"
					style={tabStyle("terminal")}
					onClick={() => handleTabClick("terminal")}
				>
					Terminal
				</button>
				<button
					type="button"
					style={tabStyle("workflow")}
					onClick={() => handleTabClick("workflow")}
				>
					工作流
				</button>
				<button
					type="button"
					style={tabStyle("visualization")}
					onClick={() => handleTabClick("visualization")}
				>
					可视化
				</button>
				<button
					type="button"
					style={tabStyle("dashboard")}
					onClick={() => handleTabClick("dashboard")}
				>
					仪表盘
				</button>

				{/* 右侧工具按钮 */}
				<div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
					<button
						type="button"
						className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
							showKnowledge
								? "bg-accent text-accent-foreground"
								: "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
						}`}
						onClick={toggleKnowledge}
						title={t("ui.workspace.knowledge")}
						aria-label={t("ui.workspace.knowledge")}
					>
						<Search className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* Content + optional knowledge panel */}
			{/* MVP: tab content conditionally renders based on activeTab.
           This unmounts panels when switching tabs, keeping memory low. */}
			<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
				<div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
					{activeTab === "dashboard" ? (
						<WidgetGrid columns={2} gap={16}>
							<DashboardWidget title={t("ui.widget.projectStatus")}>
								<WorkflowStatePanel
									cwd={workspaceCwd}
									workspaceId={workspaceId}
									title={t("ui.workspace.workflowState")}
								/>
							</DashboardWidget>
							<DashboardWidget title={t("ui.widget.ralphSession")}>
								<RalphPanel
									cwd={workspaceCwd}
									workspaceId={workspaceId}
									title={t("ui.workspace.ralphSession")}
								/>
							</DashboardWidget>
						</WidgetGrid>
					) : activeTab === "workflow" ? (
						<div style={{ display: "flex", height: "100%" }}>
							<div
								style={{
									flex: 1,
									overflow: "auto",
									borderRight: "1px solid var(--border, #2a2a2a)",
								}}
							>
								<WorkflowStatePanel
									cwd={workspaceCwd}
									workspaceId={workspaceId}
									title={t("ui.workspace.workflowState")}
								/>
							</div>
							<div style={{ flex: 1, overflow: "auto" }}>
								<RalphPanel
									cwd={workspaceCwd}
									workspaceId={workspaceId}
									title={t("ui.workspace.ralphSession")}
								/>
							</div>
						</div>
					) : activeTab === "visualization" ? (
						<VisualizationPanel
							cwd={workspaceCwd}
							workspaceId={workspaceId}
							title={t("ui.workspace.visualization")}
						/>
					) : (
						<Outlet />
					)}
				</div>
				{showKnowledge && (
					<div
						style={{
							width: "320px",
							flexShrink: 0,
							borderLeft: "1px solid var(--border, #2a2a2a)",
							overflow: "hidden",
						}}
					>
						<KnowledgePanel cwd={workspaceCwd} workspaceId={workspaceId} />
					</div>
				)}
			</div>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId")(
	{
		component: WorkspaceLayout,
	},
);
