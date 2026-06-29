// @ts-nocheck — layout route type pending tsr parent route resolution
import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { Search, X, PanelRight } from "lucide-react";
import { useState, useCallback } from "react";
import { useTabsStore } from "renderer/stores/tabs/store";
import { KnowledgePanel } from "renderer/components/KnowledgePanel/KnowledgePanel";
import { RalphPanel } from "renderer/components/RalphPanel/RalphPanel";
import { WorkflowStatePanel } from "renderer/components/WorkflowStatePanel/WorkflowStatePanel";
import { VisualizationPanel } from "renderer/components/VisualizationPanel/VisualizationPanel";

type WorkspaceTab = "overview" | "chat" | "terminal" | "workflow" | "visualization";

function WorkspaceLayout() {
  const { workspaceId } = useParams({ strict: false });
  const tabs = useTabsStore((s) => s.tabs);
  const addChatTab = useTabsStore((s) => s.addChatTab);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  const toggleKnowledge = useCallback(() => {
    setShowKnowledge((prev) => !prev);
  }, []);

  // 获取当前 workspace 的 tabs
  const workspaceTabs = tabs.filter((t) => t.workspaceId === workspaceId);

  const handleAddChatTab = () => {
    if (workspaceId) {
      addChatTab(workspaceId);
    }
  };

  const handleTabClick = (tab: WorkspaceTab) => {
    if (tab === "chat") {
      handleAddChatTab();
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
        <button type="button" style={tabStyle("overview")} onClick={() => handleTabClick("overview")}>
          Overview
        </button>
        <button type="button" style={tabStyle("chat")} onClick={() => handleTabClick("chat")}>
          Chat
        </button>
        <button type="button" style={tabStyle("terminal")} onClick={() => handleTabClick("terminal")}>
          Terminal
        </button>
        <button type="button" style={tabStyle("workflow")} onClick={() => handleTabClick("workflow")}>
          工作流
        </button>
        <button type="button" style={tabStyle("visualization")} onClick={() => handleTabClick("visualization")}>
          可视化
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
            title="知识图谱"
            aria-label="知识图谱"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content + optional knowledge panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          {activeTab === "workflow" ? (
            <div style={{ display: "flex", height: "100%" }}>
              <div style={{ flex: 1, overflow: "auto", borderRight: "1px solid var(--border, #2a2a2a)" }}>
                <WorkflowStatePanel cwd={""} />
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                <RalphPanel cwd={""} />
              </div>
            </div>
          ) : activeTab === "visualization" ? (
            <VisualizationPanel cwd={""} />
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
            <KnowledgePanel
              cwd={""}
              placeholder="搜索知识图谱..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId")({
  component: WorkspaceLayout,
});
