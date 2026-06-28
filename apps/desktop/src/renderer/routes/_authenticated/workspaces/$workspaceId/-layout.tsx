// @ts-nocheck
import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { Search, X, PanelRight } from "lucide-react";
import { useState, useCallback } from "react";
import { useTabsStore } from "renderer/stores/tabs/store";
import { KnowledgePanel } from "renderer/components/KnowledgePanel/KnowledgePanel";

function WorkspaceLayout() {
  const { workspaceId } = useParams({ strict: false });
  const tabs = useTabsStore((s) => s.tabs);
  const addChatTab = useTabsStore((s) => s.addChatTab);
  const [showKnowledge, setShowKnowledge] = useState(false);

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
        <span
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            background: "var(--accent, #1a1a2e)",
            color: "var(--accent-foreground, #e0e0e0)",
          }}
        >
          Overview
        </span>
        <button
          type="button"
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            opacity: 0.4,
          }}
          className="hover:opacity-80"
          onClick={handleAddChatTab}
        >
          Chat
        </button>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            opacity: 0.4,
          }}
        >
          Terminal
        </span>

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
          <Outlet />
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
