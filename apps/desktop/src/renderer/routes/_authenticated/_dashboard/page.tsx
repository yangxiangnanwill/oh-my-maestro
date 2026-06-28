import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { FolderGit2, Loader2 } from "lucide-react";
import { electronTrpc } from "renderer/lib/electron-trpc";
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
          {name || "Unnamed Workspace"}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{type}</p>
      </div>
      {isUnread && (
        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" />
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>加载工作区列表...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <FolderGit2 className="h-12 w-12 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">还没有工作区</p>
      <p className="max-w-[240px] text-xs text-muted-foreground/60">
        点击侧边栏的 "New Workspace" 按钮创建第一个工作区
      </p>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  // 使用 tRPC 获取工作区列表
  const {
    data: workspaceGroups,
    isLoading,
    error,
  } = electronTrpc.workspaces.getAllGrouped.useQuery();

  const handleWorkspaceClick = (workspaceId: string) => {
    navigateToWorkspace(workspaceId, navigate);
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 600,
          margin: "0 0 8px 0",
        }}
      >
        Dashboard
      </h1>
      <p style={{ fontSize: "14px", opacity: 0.5, margin: "0 0 32px 0" }}>
        Your workspaces and projects
      </p>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <p>加载工作区列表失败</p>
          <p className="text-xs text-red-500">
            {error instanceof Error ? error.message : "未知错误"}
          </p>
        </div>
      ) : !workspaceGroups || workspaceGroups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {workspaceGroups.map((group) => (
            <section key={group.project.id}>
              {/* 项目标题 */}
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  margin: "0 0 12px 0",
                  opacity: 0.7,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: group.project.color || "#666" }}
                />
                {group.project.name}
              </h2>

              {/* Section 分组 */}
              {group.sections
                .filter((section) => section.workspaces.length > 0)
                .map((section) => (
                  <div key={section.id} className="mb-4">
                    <h3 className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                      {section.name}
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                      {section.workspaces.map((ws) => (
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
                  </div>
                ))}

              {/* Ungrouped workspaces */}
              {group.workspaces.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                  {group.workspaces.map((ws) => (
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/_dashboard/")({
  component: DashboardPage,
});
