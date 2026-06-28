// @ts-nocheck — layout route type pending tsr parent route resolution
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  FolderGit2,
  ListChecks,
  Search,
  Plus,
} from "lucide-react";
import { useState, useCallback } from "react";
import { CommandChainPanel } from "renderer/components/CommandChainPanel/CommandChainPanel";
import { KnowledgePanel } from "renderer/components/KnowledgePanel/KnowledgePanel";
import { CollectionsProvider } from "../providers/CollectionsProvider";
import { LocalHostServiceProvider } from "../providers/LocalHostServiceProvider";
import { navigateToWorkspace } from "./utils/workspace-navigation";

// Phase 4: 替换为 tRPC useQuery
const MOCK_WORKSPACES = [
  { id: "demo-1", name: "My First Project", isUnread: false },
  { id: "demo-2", name: "API Server", isUnread: true },
  { id: "demo-3", name: "Frontend App", isUnread: false },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function DashboardSidebar() {
  const navigate = useNavigate();

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
          Workspaces
        </h2>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={() => alert("New Workspace — Phase 4")}
          title="New Workspace"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {MOCK_WORKSPACES.map((ws) => (
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

      <p style={{ fontSize: "11px", opacity: 0.25, marginTop: "auto", textAlign: "center" }}>
        Phase 3 stub
      </p>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// 右侧面板区域 (CommandChain + Knowledge)
// ---------------------------------------------------------------------------

type RightPanel = "none" | "commandChain" | "knowledge";

function RightSidePanel() {
  const [activePanel, setActivePanel] = useState<RightPanel>("none");

  const togglePanel = useCallback((panel: RightPanel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  }, []);

  const isCommandChainOpen = activePanel === "commandChain";
  const isKnowledgeOpen = activePanel === "knowledge";
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
          title="Command Chain"
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
          title="Knowledge"
        >
          <Search className="h-4 w-4" />
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
            <CommandChainPanel cwd={""} title="Command Chain" />
          )}
          {isKnowledgeOpen && (
            <KnowledgePanel cwd={""} placeholder="Search knowledge..." />
          )}
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
        </div>
      </LocalHostServiceProvider>
    </CollectionsProvider>
  );
}

export const Route = createFileRoute("/_authenticated/_dashboard")({
  component: DashboardLayout,
});
