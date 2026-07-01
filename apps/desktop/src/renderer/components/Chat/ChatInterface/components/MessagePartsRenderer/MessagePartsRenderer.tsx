import { ExploringGroup } from "../../../stubs/ui/ai-elements/exploring-group";
import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";
import {
	AlertCircleIcon,
	FileIcon,
	FileSearchIcon,
	FolderTreeIcon,
	SearchIcon,
} from "lucide-react";
import React, { useCallback, useMemo } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { useTheme } from "renderer/stores";
import { useTabsStore } from "renderer/stores/tabs/store";
import { isSafeExternalUrl } from "shared/safe-url";
import { READ_ONLY_TOOLS } from "../../constants";
import {
	getWorkspaceToolFilePath,
	normalizeWorkspaceFilePath,
} from "../../utils/file-paths";
import type { ToolPart } from "../../utils/tool-helpers";
import { getArgs, normalizeToolName } from "../../utils/tool-helpers";
import { ReadOnlyToolCall } from "../ReadOnlyToolCall";
import { ReasoningBlock } from "../ReasoningBlock";
import { ToolCallBlock } from "../ToolCallBlock";
import { StreamingMessageText } from "./components/StreamingMessageText";

type LinkAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>, href?: string) => void;
};

const LinkAnchor = React.memo(function LinkAnchor({
	href,
	children,
	onClick,
	...props
}: LinkAnchorProps) {
	// XSS hardening: drop non-allowlisted schemes (javascript:/data:) so the
	// renderer never renders an actionable dangerous anchor.
	const safeHref = href && isSafeExternalUrl(href) ? href : undefined;
	return (
		<a
			{...props}
			href={safeHref}
			onClick={(e) => {
				// Even when openLinksInApp=false, block navigation for unsafe
				// schemes so javascript:/data: hrefs can never fire.
				if (href && !isSafeExternalUrl(href)) {
					e.preventDefault();
					return;
				}
				if (href) onClick?.(e, href);
			}}
		>
			{children}
		</a>
	);
});

interface MessagePartsRendererProps {
	parts: UIMessage["parts"];
	isLastAssistant: boolean;
	isStreaming: boolean;
	isInterrupted?: boolean;
	workspaceId?: string;
	workspaceCwd?: string;
	onAnswer?: (
		toolCallId: string,
		answers: Record<string, string>,
	) => Promise<void> | void;
}

export function MessagePartsRenderer({
	parts,
	isLastAssistant,
	isStreaming,
	isInterrupted,
	workspaceId,
	workspaceCwd,
	onAnswer,
}: MessagePartsRendererProps): React.ReactNode[] {
	const theme = useTheme();
	const { data: openLinksInApp } =
		electronTrpc.settings.getOpenLinksInApp.useQuery();
	const openInBrowserPane = useTabsStore((s) => s.openInBrowserPane);
	const addFileViewerPane = useTabsStore((store) => store.addFileViewerPane);

	const handleLinkClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
			if (openLinksInApp && workspaceId) {
				e.preventDefault();
				// Defense in depth: LinkAnchor already sanitized href, but gate
				// openInBrowserPane as well so an unsafe URL never reaches the
				// browser pane / webContents.loadURL.
				if (!isSafeExternalUrl(href)) return;
				openInBrowserPane(workspaceId, href);
			}
		},
		[openLinksInApp, workspaceId, openInBrowserPane],
	);
	const openFileInPane = useCallback(
		(filePath: string) => {
			if (!workspaceId) return;
			const normalizedPath = normalizeWorkspaceFilePath({
				filePath,
				workspaceRoot: workspaceCwd,
			});
			if (!normalizedPath) return;
			addFileViewerPane(workspaceId, { filePath: normalizedPath });
		},
		[addFileViewerPane, workspaceCwd, workspaceId],
	);

	const components = useMemo(() => {
		if (!openLinksInApp || !workspaceId) return undefined;
		return {
			a: LinkAnchor,
			aProps: { onClick: handleLinkClick },
		};
	}, [openLinksInApp, workspaceId, handleLinkClick]);
	const mermaidConfig = useMemo(
		() => ({
			config: {
				theme:
					theme?.type !== "light" ? ("dark" as const) : ("default" as const),
			},
		}),
		[theme?.type],
	);

	const renderParts = useCallback((): React.ReactNode[] => {
		const nodes: React.ReactNode[] = [];
		let i = 0;

		while (i < parts.length) {
			const part = parts[i];

			if (part.type === "text") {
				nodes.push(
					<StreamingMessageText
						key={i}
						text={part.text}
						isAnimating={isLastAssistant && isStreaming}
						mermaid={mermaidConfig}
						components={components}
					/>,
				);
				i++;
				continue;
			}

			if ((part as { type: string }).type === "error") {
				const errorPart = part as unknown as { type: "error"; text: string };
				nodes.push(
					<div
						key={i}
						className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive"
					>
						<AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
						<span className="select-text">{errorPart.text}</span>
					</div>,
				);
				i++;
				continue;
			}

			if (part.type === "reasoning") {
				nodes.push(<ReasoningBlock key={i} reasoning={part.text} />);
				i++;
				continue;
			}

			if (isToolUIPart(part)) {
				const toolName = normalizeToolName(getToolName(part));

				// Group consecutive read-only tools into ExploringGroup
				if (READ_ONLY_TOOLS.has(toolName)) {
					// Read-file calls should render content inline instead of being grouped away.
					if (toolName === "mastra_workspace_read_file") {
						nodes.push(
							<ReadOnlyToolCall
								key={part.toolCallId}
								part={part as ToolPart}
								workspaceId={workspaceId}
								workspaceCwd={workspaceCwd}
								onOpenFileInPane={openFileInPane}
							/>,
						);
						i++;
						continue;
					}

					const groupStart = i;
					const groupParts: ToolPart[] = [];
					while (
						i < parts.length &&
						isToolUIPart(parts[i]) &&
						READ_ONLY_TOOLS.has(
							normalizeToolName(getToolName(parts[i] as ToolPart)),
						) &&
						normalizeToolName(getToolName(parts[i] as ToolPart)) !==
							"mastra_workspace_read_file"
					) {
						groupParts.push(parts[i] as ToolPart);
						i++;
					}

					// Single read-only tool: render inline without group wrapper
					if (groupParts.length === 1) {
						nodes.push(
							<ReadOnlyToolCall
								key={groupParts[0].toolCallId}
								part={groupParts[0]}
								workspaceId={workspaceId}
								workspaceCwd={workspaceCwd}
								onOpenFileInPane={openFileInPane}
							/>,
						);
						continue;
					}

					// Multiple consecutive read-only tools: group them
					const anyPending = groupParts.some(
						(p) => p.state !== "output-available" && p.state !== "output-error",
					);
					const exploringItems = groupParts.map((p) => {
						const args = getArgs(p);
						const name = normalizeToolName(getToolName(p));
						const filePath = getWorkspaceToolFilePath({
							toolName: name,
							args,
						});
						let title = "Read";
						let subtitle = "";
						let icon = FileIcon;
						switch (name) {
							case "mastra_workspace_read_file":
								title =
									p.state !== "output-available" && p.state !== "output-error"
										? "Reading"
										: "Read";
								subtitle = String(
									args.path ??
										args.filePath ??
										args.file_path ??
										args.file ??
										"",
								);
								icon = FileIcon;
								break;
							case "mastra_workspace_list_files":
								title =
									p.state !== "output-available" && p.state !== "output-error"
										? "Listing"
										: "Listed";
								subtitle = String(
									args.path ??
										args.directory ??
										args.directoryPath ??
										args.directory_path ??
										args.root ??
										args.cwd ??
										"",
								);
								icon = FolderTreeIcon;
								break;
							case "mastra_workspace_file_stat":
								title =
									p.state !== "output-available" && p.state !== "output-error"
										? "Checking"
										: "Checked";
								subtitle = String(
									args.path ?? args.file_path ?? args.file ?? "",
								);
								icon = FileSearchIcon;
								break;
							case "mastra_workspace_search":
								title =
									p.state !== "output-available" && p.state !== "output-error"
										? "Searching"
										: "Searched";
								subtitle = String(
									args.query ??
										args.pattern ??
										args.regex ??
										args.substring_pattern ??
										args.text ??
										"",
								);
								icon = SearchIcon;
								break;
							case "mastra_workspace_index":
								title =
									p.state !== "output-available" && p.state !== "output-error"
										? "Indexing"
										: "Indexed";
								icon = SearchIcon;
								break;
							default:
								title = name.replace("mastra_workspace_", "");
								icon = FileIcon;
								break;
						}
						// Show just filename for long paths
						if (subtitle.includes("/")) {
							subtitle = subtitle.split("/").pop() ?? subtitle;
						}
						return {
							icon,
							label: title,
							description: subtitle || undefined,
							status:
								p.state === "output-error"
									? "error"
									: p.state !== "output-available"
										? "pending"
										: undefined,
							onClick: filePath ? () => openFileInPane(filePath) : undefined,
						};
					});

					nodes.push(
						<ExploringGroup
							key={`explore-${groupStart}`}
							items={exploringItems}
							isStreaming={anyPending && isLastAssistant && isStreaming}
						/>,
					);
					continue;
				}

				// Non-read-only tool: render as BashTool/FileDiffTool/WebSearch/etc.
				nodes.push(
					<ToolCallBlock
						key={part.toolCallId}
						part={part as ToolPart}
						isInterrupted={isInterrupted}
						workspaceId={workspaceId}
						workspaceCwd={workspaceCwd}
						onAnswer={onAnswer}
					/>,
				);
				i++;
				continue;
			}

			// Unknown part type (source, file, step-start, etc.) — skip
			i++;
		}

		return nodes;
	}, [
		parts,
		isLastAssistant,
		isStreaming,
		isInterrupted,
		workspaceId,
		workspaceCwd,
		components,
		mermaidConfig,
		openFileInPane,
		onAnswer,
	]);

	return renderParts();
}
