// @ts-nocheck — layout route type pending tsr parent route resolution
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  FolderGit2,
  ListChecks,
  Search,
  Plus,
  Loader2,
  Activity,
  FolderTree,
  BarChart3,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { useNewWorkspaceModalStore } from "renderer/stores/new-workspace-modal";
import { NewWorkspaceModal } from "renderer/components/NewWorkspaceModal";
import { CommandChainPanel } from "renderer/components/CommandChainPanel/CommandChainPanel";
import { KnowledgePanel } from "renderer/components/KnowledgePanel/KnowledgePanel";
import { RalphPanel } from "renderer/components/RalphPanel/RalphPanel";
import { WorkflowStatePanel } from "renderer/components/WorkflowStatePanel/WorkflowStatePanel";
import { VisualizationPanel } from "renderer/components/VisualizationPanel/VisualizationPanel";
import { CollectionsProvider } from "../providers/CollectionsProvider";
import { LocalHostServiceProvider } from "../providers/LocalHostServiceProvider";
import { navigateToWorkspace } from "./utils/workspace-navigation";


// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function DashboardSidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: workspaces, isLoading } =
    electronTrpc.workspaces.getAll.useQuery();

  const handleWorkspaceClick = (workspaceId: string) => {
    navigateToWorkspace(workspaceId, navigate);
  };

  return (
    <aside
      style={{
        width: "260px",
        borderRight: "1px solid var(--border, #2a2a2a)",
        padding: "16px",
        overflowY: "auto",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 600,
            opacity: 0.5,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t("ui.dashboard.recentWorkspaces")}
        </h2>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => useNewWorkspaceModalStore.getState().openModal()}
          title={t("ui.dashboard.newWorkspace")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{t("ui.common.loading")}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {(workspaces ?? []).map((ws) => (
            <button
              key={ws.id}
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                padding: "5px 8px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: "var(--foreground, #e0e0e0)",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s",
              }}
              className="hover:bg-accent/10"
              onClick={() => handleWorkspaceClick(ws.id)}
            >
              <FolderGit2
                style={{
                  width: "14px",
                  height: "14px",
                  opacity: 0.4,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ws.name}
              </span>
              {ws.isUnread && (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent, #4a9eff)",
                    flexShrink: 0,
                    marginLeft: "auto",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// 右侧面板区域 (CommandChain + Knowledge)
// ---------------------------------------------------------------------------

type RightPanel = "none" | "commandChain" | "knowledge" | "ralph" | "workflow" | "visualization";

function RightSidePanel() {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<RightPanel>("none");

  const togglePanel = useCallback((panel: RightPanel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  }, []);

  const isCommandChainOpen = activePanel === "commandChain";
  const isKnowledgeOpen = activePanel === "knowledge";
  const isRalphOpen = activePanel === "ralph";
  const isWorkflowOpen = activePanel === "workflow";
  const isVisualizationOpen = activePanel === "visualization";
  const isAnyOpen = activePanel !== "none";

  return (
    <div style={{ display: "flex", flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--border, #2a2a2a)",
          padding: "8px 4px",
          gap: "4px",
          background: "var(--background, #0a0a0a)",
        }}
      >
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            isCommandChainOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          onClick={() => togglePanel("commandChain")}
          title={t("ui.workspace.commandChain")}
        >
          <ListChecks className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            isKnowledgeOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          onClick={() => togglePanel("knowledge")}
          title={t("ui.workspace.knowledge")}
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            isRalphOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          onClick={() => togglePanel("ralph")}
          title="Ralph 会话"
        >
          <Activity className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            isWorkflowOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          onClick={() => togglePanel("workflow")}
          title="工作流状态"
        >
          <FolderTree className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            isVisualizationOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          }`}
          onClick={() => togglePanel("visualization")}
          title="可视化"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
      </div>

      {isAnyOpen && (
        <div
          style={{
            width: "320px",
            borderLeft: "1px solid var(--border, #2a2a2a)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isCommandChainOpen && (
            <CommandChainPanel cwd={""} title={t("ui.workspace.commandChain")} />
          )}
          {isKnowledgeOpen && (
            <KnowledgePanel cwd={""} placeholder="Search knowledge..." />
          )}
          {isRalphOpen && <RalphPanel cwd={""} />}
          {isWorkflowOpen && <WorkflowStatePanel cwd={""} />}
          {isVisualizationOpen && <VisualizationPanel cwd={""} />}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Layout
// ---------------------------------------------------------------------------

function DashboardLayout() {
  return (
    <CollectionsProvider>
      <LocalHostServiceProvider>
        <div
          style={{
            display: "flex",
            height: "100vh",
            background: "var(--background, #0a0a0a)",
            color: "var(--foreground, #e0e0e0)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <DashboardSidebar />
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px",
              minWidth: 0,
            }}
          >
            <Outlet />
          </main>
          <RightSidePanel />
          <NewWorkspaceModal />
        </div>
      </LocalHostServiceProvider>
    </CollectionsProvider>
  );
}

export const Route = createFileRoute("/_authenticated/_dashboard")({
  component: DashboardLayout,
});
