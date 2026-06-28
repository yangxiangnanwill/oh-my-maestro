// @ts-nocheck
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  MessageSquare,
  Terminal as TerminalIcon,
  LayoutGrid,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import {
  createRuntime,
  attachToContainer,
  detachFromContainer,
  disposeRuntime,
  type TerminalRuntime,
} from "renderer/lib/terminal/terminal-runtime";
import {
  getDefaultTerminalAppearance,
  type TerminalAppearance,
} from "renderer/lib/terminal/appearance";

// ---------------------------------------------------------------------------
// Chat Panel (简化版)
// ---------------------------------------------------------------------------

function ChatPanel({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // TODO: Phase 5 — 接入实际 Chat Service
      const result = await electronTrpc.chatService.send.useMutation().mutateAsync({
        workspaceId,
        message: text,
        sessionId: "default",
      });
      const assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: result?.response ?? "已收到消息，但回复不可用",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: `错误: ${err instanceof Error ? err.message : "未知错误"}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 标题 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          Chat
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {workspaceId}
        </p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p>开始对话</p>
            <p className="text-xs">输入消息以与 AI 助手对话</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="animate-pulse">思考中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="flex-shrink-0 border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
            disabled={isLoading}
          />
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            发送
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Chat Service 集成中 — 当前使用简化版面板
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Terminal Panel
// ---------------------------------------------------------------------------

function TerminalPanel({ workspaceId }: { workspaceId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<TerminalRuntime | null>(null);
  const [appearance] = useState<TerminalAppearance>(() =>
    getDefaultTerminalAppearance(),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const runtime = createRuntime(`workspace-${workspaceId}`, appearance);
    runtimeRef.current = runtime;
    attachToContainer(runtime, container as HTMLDivElement, undefined, {
      focus: true,
    });

    return () => {
      if (runtimeRef.current) {
        detachFromContainer(runtimeRef.current);
        disposeRuntime(runtimeRef.current);
        runtimeRef.current = null;
      }
    };
  }, [workspaceId, appearance]);

  return (
    <div className="flex h-full flex-col">
      {/* 标题 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <TerminalIcon className="h-4 w-4" />
          Terminal
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {workspaceId}
        </p>
      </div>

      {/* xterm.js 挂载点 */}
      <div ref={containerRef} className="flex-1 overflow-hidden p-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Panel
// ---------------------------------------------------------------------------

function OverviewPanel({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate();
  const { data: workspace } = electronTrpc.workspaces.get.useQuery(
    { id: workspaceId },
    { enabled: !!workspaceId },
  );

  return (
    <div className="flex h-full flex-col">
      {/* 标题 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <LayoutGrid className="h-4 w-4" />
          Overview
        </h3>
      </div>

      {/* 工作区详情 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!workspace ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">名称</p>
              <p className="text-sm">{workspace.name || "Unnamed"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">类型</p>
              <p className="text-sm capitalize">{workspace.type}</p>
            </div>
            {workspace.project && (
              <div>
                <p className="text-xs text-muted-foreground">项目</p>
                <p className="text-sm">{workspace.project.name}</p>
              </div>
            )}
            {workspace.worktreePath && (
              <div>
                <p className="text-xs text-muted-foreground">路径</p>
                <p className="max-w-[400px] truncate text-sm font-mono">
                  {workspace.worktreePath}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">ID</p>
              <p className="text-sm font-mono text-xs opacity-60">
                {workspaceId}
              </p>
            </div>

            <button
              type="button"
              className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
              onClick={() => navigate({ to: "/" as never })}
            >
              返回 Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 视图状态 & 布局
// ---------------------------------------------------------------------------

type ViewLayout = "split" | "chat" | "terminal";

function WorkspacePage() {
  const { workspaceId } = useParams({ strict: false }) as { workspaceId: string };
  const [viewLayout, setViewLayout] = useState<ViewLayout>("split");

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No workspace selected</p>
      </div>
    );
  }

  const isSplit = viewLayout === "split";
  const isChat = viewLayout === "chat";
  const isTerminal = viewLayout === "terminal";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 布局切换 */}
      <div className="flex-shrink-0 flex items-center gap-2 border-b px-4 py-2">
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-xs transition-colors ${
            isSplit
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setViewLayout("split")}
        >
          Split View
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-xs transition-colors ${
            isChat
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setViewLayout("chat")}
        >
          Chat Only
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-xs transition-colors ${
            isTerminal
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setViewLayout("terminal")}
        >
          Terminal Only
        </button>
      </div>

      {/* 面板区 */}
      <div className="flex flex-1 overflow-hidden">
        {isSplit && (
          <>
            <div className="flex-1 border-r">
              <ChatPanel workspaceId={workspaceId ?? "unknown"} />
            </div>
            <div className="flex-1">
              <TerminalPanel workspaceId={workspaceId ?? "unknown"} />
            </div>
          </>
        )}
        {isChat && (
          <div className="flex-1">
            <ChatPanel workspaceId={workspaceId ?? "unknown"} />
          </div>
        )}
        {isTerminal && (
          <div className="flex-1">
            <TerminalPanel workspaceId={workspaceId ?? "unknown"} />
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/workspaces/$workspaceId/")({
  component: WorkspacePage,
});
