// @ts-nocheck
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import {
	MessageSquare,
	Terminal as TerminalIcon,
	LayoutGrid,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { useTranslation } from "renderer/contexts/TranslationContext";
import { electronTrpc } from "renderer/lib/electron-trpc";

// ---------------------------------------------------------------------------
// Chat Panel
// ---------------------------------------------------------------------------

function ChatPanel({ workspaceId }: { workspaceId: string }) {
	const { t } = useTranslation();
	const [messages, setMessages] = useState<
		{ id: string; role: "user" | "assistant"; content: string }[]
	>([]);
	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const sendMutation = electronTrpc.chatService.send.useMutation({
		onSuccess: (data) => {
			const assistantMsg = {
				id: crypto.randomUUID(),
				role: "assistant" as const,
				content: data.content,
			};
			setMessages((prev) => [...prev, assistantMsg]);
		},
	});

	const isLoading = sendMutation.isPending;

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	const handleSend = () => {
		const text = input.trim();
		if (!text || isLoading) return;

		const userMsg = {
			id: crypto.randomUUID(),
			role: "user" as const,
			content: text,
		};
		const updatedMessages = [...messages, userMsg];
		setMessages(updatedMessages);
		setInput("");

		sendMutation.mutate({ messages: updatedMessages });
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex-shrink-0 border-b px-4 py-3">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<MessageSquare className="h-4 w-4" />
					{t("ui.workspace.chat")}
				</h3>
				<p className="mt-0.5 text-xs text-muted-foreground">{workspaceId}</p>
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-3">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
						<MessageSquare className="h-8 w-8 opacity-30" />
						<p>{t("ui.chat.startConversation")}</p>
						<p className="text-xs">{t("ui.chat.hint")}</p>
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
									<span className="animate-pulse">{t("ui.chat.thinking")}</span>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			<div className="flex-shrink-0 border-t p-3">
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("ui.chat.placeholder")}
						className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
						disabled={isLoading}
					/>
					<button
						type="button"
						className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50"
						onClick={handleSend}
						disabled={isLoading || !input.trim()}
					>
						{t("ui.chat.send")}
					</button>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Terminal Panel
// ---------------------------------------------------------------------------

function TerminalPanel({ workspaceId }: { workspaceId: string }) {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLDivElement>(null);
	const runtimeRef = useRef<TerminalRuntime | null>(null);
	const paneIdRef = useRef<string>(`workspace-${workspaceId}`);
	const [appearance] = useState<TerminalAppearance>(() =>
		getDefaultTerminalAppearance(),
	);

	const createOrAttach = electronTrpc.terminal.createOrAttach.useMutation();
	const writeMutation = electronTrpc.terminal.write.useMutation();
	const resizeMutation = electronTrpc.terminal.resize.useMutation();

	// Subscribe to PTY stream and forward output to xterm
	electronTrpc.terminal.stream.useSubscription(paneIdRef.current, {
		onData: (event) => {
			if (event.type === "data" && runtimeRef.current) {
				runtimeRef.current.terminal.write(event.data);
			}
		},
	});

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const terminalId = `workspace-${workspaceId}`;
		const runtime = createRuntime(terminalId, appearance);
		runtimeRef.current = runtime;
		attachToContainer(runtime, container as HTMLDivElement, undefined, {
			focus: true,
		});

		const paneId = terminalId;
		paneIdRef.current = paneId;

		// Create PTY session
		createOrAttach.mutate({
			paneId,
			tabId: `tab-${workspaceId}`,
			workspaceId,
		});

		// Connect xterm input to PTY
		const onDataDispose = runtime.terminal.onData((data) => {
			writeMutation.mutate({ paneId, data });
		});

		// Connect xterm resize to PTY
		const onResizeDispose = runtime.terminal.onResize(({ cols, rows }) => {
			resizeMutation.mutate({ paneId, cols, rows });
		});

		return () => {
			onDataDispose.dispose();
			onResizeDispose.dispose();
			if (runtimeRef.current) {
				detachFromContainer(runtimeRef.current);
				disposeRuntime(runtimeRef.current);
				runtimeRef.current = null;
			}
		};
	}, [
		workspaceId,
		appearance,
		writeMutation.mutate,
		resizeMutation.mutate, // Create PTY session
		createOrAttach.mutate,
	]);

	return (
		<div className="flex h-full flex-col">
			<div className="flex-shrink-0 border-b px-4 py-3">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<TerminalIcon className="h-4 w-4" />
					{t("ui.workspace.terminal")}
				</h3>
				<p className="mt-0.5 text-xs text-muted-foreground">{workspaceId}</p>
			</div>
			<div ref={containerRef} className="flex-1 overflow-hidden p-1" />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Overview Panel
// ---------------------------------------------------------------------------

function OverviewPanel({ workspaceId }: { workspaceId: string }) {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className="flex h-full flex-col">
			<div className="flex-shrink-0 border-b px-4 py-3">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<LayoutGrid className="h-4 w-4" />
					{t("ui.workspace.overview")}
				</h3>
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-3">
				<div className="space-y-4">
					<div>
						<p className="text-xs text-muted-foreground">
							{t("ui.workspace.workspaceId")}
						</p>
						<p className="text-sm font-mono text-xs opacity-60">
							{workspaceId}
						</p>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("ui.workspace.overview")}
					</p>
					<button
						type="button"
						className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80"
						onClick={() => navigate({ to: "/" as never })}
					>
						{t("ui.workspace.backToDashboard")}
					</button>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 视图状态 & 布局
// ---------------------------------------------------------------------------

type ViewLayout = "split" | "chat" | "terminal";

function WorkspacePage() {
	const { workspaceId } = useParams({ strict: false }) as {
		workspaceId: string;
	};
	const { t } = useTranslation();
	const [viewLayout, setViewLayout] = useState<ViewLayout>("split");

	if (!workspaceId) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<p>{t("ui.workspace.noWorkspace")}</p>
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
					{t("ui.workspace.splitView")}
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
					{t("ui.workspace.chatOnly")}
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
					{t("ui.workspace.terminalOnly")}
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

export const Route = createFileRoute(
	"/_authenticated/workspaces/$workspaceId/",
)({
	component: WorkspacePage,
});
