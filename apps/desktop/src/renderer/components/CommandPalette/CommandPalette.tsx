import { AlertTriangle, Command, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "renderer/contexts/TranslationContext";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { CommandItem } from "./CommandItem";
import {
	CATEGORY_LABELS,
	type CommandPaletteProps,
	type MaestroCommand,
} from "./types";

/** 分组命令列表（按 category 分组） */
interface GroupedCommands {
	category: string;
	label: string;
	commands: MaestroCommand[];
}

function groupCommands(commands: MaestroCommand[]): GroupedCommands[] {
	const groups = new Map<string, MaestroCommand[]>();
	for (const cmd of commands) {
		const existing = groups.get(cmd.category);
		if (existing) {
			existing.push(cmd);
		} else {
			groups.set(cmd.category, [cmd]);
		}
	}

	// 按固定顺序排列分组
	const categoryOrder: string[] = [
		"workflow",
		"ralph",
		"knowledge",
		"project",
		"debug",
		"config",
		"system",
	];
	const result: GroupedCommands[] = [];
	for (const cat of categoryOrder) {
		const cmds = groups.get(cat);
		if (cmds && cmds.length > 0) {
			result.push({
				category: cat,
				label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
				commands: cmds.sort((a, b) => a.name.localeCompare(b.name)),
			});
		}
		groups.delete(cat);
	}
	// 剩余未在固定顺序中的分类
	for (const [cat, cmds] of groups) {
		result.push({
			category: cat,
			label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat,
			commands: cmds.sort((a, b) => a.name.localeCompare(b.name)),
		});
	}
	return result;
}

function LoadingState() {
	return (
		<div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
			<Loader2 className="h-4 w-4 animate-spin" />
			<span>加载命令列表...</span>
		</div>
	);
}

function ErrorState({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center gap-2 py-12 text-center text-sm">
			<AlertTriangle className="h-8 w-8 text-amber-500" />
			<p className="text-muted-foreground">获取命令列表失败</p>
			<p className="max-w-[280px] text-xs text-red-500">{message}</p>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
			<Command className="h-8 w-8" />
			<p>无匹配的命令</p>
			<p className="text-xs">尝试其他关键词</p>
		</div>
	);
}

/**
 * CommandPalette — 模态命令面板。
 *
 * 提供 Maestro command 的搜索、过滤、分组展示和键盘导航。
 * - 使用 `electronTrpc.maestro.commands.list.useQuery` 获取命令列表
 * - 实时过滤：按命令名和描述匹配用户输入
 * - 键盘导航：ArrowUp / ArrowDown 移动高亮，Enter 选中执行，Escape 关闭
 * - 分组显示：按 category（knowledge/analysis/command/utility）分组
 */
export function CommandPalette({ isOpen, onClose, cwd }: CommandPaletteProps) {
	const [query, setQuery] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const { t } = useTranslation();

	// 获取命令列表
	const {
		data: commands,
		isLoading,
		error,
	} = electronTrpc.maestro.commands.list.useQuery({}, { enabled: isOpen });

	// 重置状态（面板打开时）
	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setHighlightedIndex(0);
			// 自动聚焦搜索输入框
			requestAnimationFrame(() => {
				inputRef.current?.focus();
			});
		}
	}, [isOpen]);

	// 过滤命令（使用翻译后的 label/description）
	const filteredCommands = useMemo(() => {
		if (!commands) return [];
		const q = query.toLowerCase().trim();
		if (!q) return commands;

		return commands.filter(
			(cmd) =>
				cmd.id.toLowerCase().includes(q) ||
				t(cmd.label).toLowerCase().includes(q) ||
				t(cmd.description).toLowerCase().includes(q) ||
				cmd.category.toLowerCase().includes(q),
		);
	}, [commands, query, t]);

	// 分组
	const grouped = useMemo(
		() => groupCommands(filteredCommands),
		[filteredCommands],
	);

	// 扁平化命令列表（用于键盘导航索引计算）
	const flatCommands = useMemo(() => {
		const result: MaestroCommand[] = [];
		for (const group of grouped) {
			for (const cmd of group.commands) {
				result.push(cmd);
			}
		}
		return result;
	}, [grouped]);

	// 限制高亮索引范围
	const safeHighlighted = Math.min(
		highlightedIndex,
		Math.max(0, flatCommands.length - 1),
	);

	// 选中命令 — MVP read-only 模式：仅记录选择，不执行
	const handleSelect = useCallback(
		(command: MaestroCommand) => {
			// MVP: 只暴露 riskLevel="read" 命令，选择后仅记录不执行
			console.log(`[CommandPalette] Selected (read-only): ${command.id}`);
			onClose();
		},
		[onClose],
	);

	// 键盘处理
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev < flatCommands.length - 1 ? prev + 1 : 0,
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : flatCommands.length - 1,
					);
					break;
				case "Enter":
					e.preventDefault();
					if (flatCommands[safeHighlighted]) {
						handleSelect(flatCommands[safeHighlighted]);
					}
					break;
				case "Escape":
					e.preventDefault();
					onClose();
					break;
			}
		},
		[flatCommands, safeHighlighted, onClose, handleSelect],
	);

	// 点击背景关闭
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		},
		[onClose],
	);

	// 滚动到高亮项可见
	useEffect(() => {
		if (!listRef.current) return;
		const highlighted = listRef.current.querySelector(`[aria-selected="true"]`);
		if (highlighted) {
			highlighted.scrollIntoView({ block: "nearest" });
		}
	}, []);

	if (!isOpen) return null;

	// 计算当前令列表中的高亮索引（考虑分组标题偏移）
	let flatIndex = 0;

	return (
		// 模态背景
		<div
			className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-label="命令面板"
		>
			<div className="fixed inset-x-0 top-[20%] mx-auto max-w-lg">
				<div className="overflow-hidden rounded-lg border bg-card shadow-2xl">
					{/* 搜索输入框 */}
					<div className="flex items-center gap-2 border-b px-4">
						<Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setHighlightedIndex(0);
							}}
							placeholder="搜索 Maestro 命令..."
							className="flex-1 border-0 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
						/>
						<button
							type="button"
							onClick={onClose}
							className="flex-shrink-0 rounded p-1 hover:bg-muted"
							aria-label="关闭"
						>
							<X className="h-4 w-4 text-muted-foreground" />
						</button>
					</div>

					{/* 命令列表 */}
					<div
						ref={listRef}
						className="max-h-[320px] overflow-y-auto"
						role="listbox"
					>
						{isLoading ? (
							<LoadingState />
						) : error ? (
							<ErrorState
								message={error instanceof Error ? error.message : "未知错误"}
							/>
						) : grouped.length === 0 ? (
							<EmptyState />
						) : (
							grouped.map((group) => (
								<div key={group.category}>
									{/* 分组标题 */}
									<div className="sticky top-0 bg-card/95 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground">
										{group.label}
										<span className="ml-1.5 font-normal opacity-60">
											({group.commands.length})
										</span>
									</div>
									{/* 分组命令项 */}
									{group.commands.map((cmd) => {
										const currentIdx = flatIndex++;
										return (
											<CommandItem
												key={cmd.id}
												command={{
													...cmd,
													label: t(cmd.label),
													description: t(cmd.description),
												}}
												highlighted={currentIdx === safeHighlighted}
												onSelect={handleSelect}
											/>
										);
									})}
								</div>
							))
						)}
					</div>

					{/* 底部信息 */}
					{!isLoading && !error && commands && (
						<div className="flex items-center justify-between border-t px-4 py-2 text-[10px] text-muted-foreground">
							<span>
								显示 {filteredCommands.length}/{commands.length} 个命令
								{filteredCommands.length < commands.length &&
									`（共 ${commands.length} 个）`}
							</span>
							<span className="flex items-center gap-2">
								<kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[9px]">
									↑↓
								</kbd>
								导航
								<kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[9px]">
									↵
								</kbd>
								选择
								<kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[9px]">
									Esc
								</kbd>
								关闭
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
