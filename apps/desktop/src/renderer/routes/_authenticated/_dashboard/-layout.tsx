// @ts-nocheck
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  FolderGit2,
  ListChecks,
  Search,
  Plus,
  ChevronRight,
  PanelRight,
} from "lucide-react";
import { useState, useCallback } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { NewWorkspaceModal } from "renderer/components/NewWorkspaceModal";
import { useNewWorkspaceModalStore } from "renderer/stores/new-workspace-modal";
import { CommandChainPanel } from "renderer/components/CommandChainPanel/CommandChainPanel";
import { KnowledgePanel } from "renderer/components/KnowledgePanel/KnowledgePanel";
import { CollectionsProvider } from "../providers/CollectionsProvider";
import { LocalHostServiceProvider } from "../providers/LocalHostServiceProvider";
import { navigateToWorkspace } from "./utils/workspace-navigation";

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function DashboardSidebar() {
  const navigate = useNavigate();
  const openNewWorkspaceModal = useNewWorkspaceModalStore((s) => s.openModal);

  const { data: workspaceGroups, isLoading } =
    electronTrpc.workspaces.getAllGrouped.useQuery();

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
      {/* 标题行 + 新建按钮 */}
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
          onClick={() => openNewWorkspaceModal()}
          title="New Workspace"
          aria-label="新建工作区"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 工作区列表 */}
      {isLoading ? (
        <p style={{ fontSize: "13px", opacity: 0.3, margin: 0 }}>Loading...</p>
      ) : !workspaceGroups || workspaceGroups.length === 0 ? (
        <p style={{ fontSize: "13px", opacity: 0.3, margin: 0 }}>
          No workspaces yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {workspaceGroups.map((group) => (
            <div key={group.project.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 8px",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: group.project.color || "#666",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    opacity: 0.6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {group.project.name}
                </span>
              </div>

              {group.sections
                .filter((section) => section.workspaces.length > 0)
                .map((section) => (
                  <div key={section.id}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        opacity: 0.4,
                        padding: "4px 8px 2px 22px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {section.name}
                    </div>
                    {section.workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          width: "100%",
                          padding: "5px 8px 5px 22px",
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
                          {ws.name || "Unnamed"}
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
                ))}

              {group.workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "5px 8px 5px 22px",
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
                    {ws.name || "Unnamed"}
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
          ))}
        </div>
      )}
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
    <div
      style={{
        display: "flex",
        flexShrink: 0,
      }}
    >
      {/* 面板切换钮 */}
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
          title="命令链状态"
          aria-label="命令链状态"
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
          title="知识图谱"
          aria-label="知识图谱"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* 面板内容 */}
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
            <CommandChainPanel
              cwd={""}
              title="命令链状态"
            />
          )}
          {isKnowledgeOpen && (
            <KnowledgePanel
              cwd={""}
              placeholder="搜索知识图谱..."
            />
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

          {/* Main content area */}
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

          {/* 右侧面板：CommandChain + Knowledge */}
          <RightSidePanel />

          {/* New Workspace Modal */}
          <NewWorkspaceModal />
        </div>
      </LocalHostServiceProvider>
    </CollectionsProvider>
  );
}

export const Route = createFileRoute("/_authenticated/_dashboard")({
  component: DashboardLayout,
});
