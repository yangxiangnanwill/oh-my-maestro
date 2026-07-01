import { AlertTriangle, ListChecks, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { DecisionNodeView } from "./DecisionNodeView";
import { StepItem } from "./StepItem";
import type { CommandChainPanelProps } from "./types";

function EmptyState() {
	return (
		<div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
			<ListChecks className="h-8 w-8" />
			<p>暂无可用的命令链状态</p>
			<p className="text-xs">请确认当前工作目录存在 status.json 文件</p>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
			<Loader2 className="h-4 w-4 animate-spin" />
			<span>加载中...</span>
		</div>
	);
}

function ErrorState({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
			<AlertTriangle className="h-8 w-8 text-amber-500" />
			<p className="text-muted-foreground">获取命令链状态失败</p>
			<p className="max-w-[240px] text-xs text-red-500">{message}</p>
		</div>
	);
}

export function CommandChainPanel({
	cwd,
	title = "命令链状态",
}: CommandChainPanelProps) {
	const {
		data: status,
		isLoading,
		error,
	} = electronTrpc.commandChain.getStatus.useQuery({ cwd }, {});

	const handleDecisionSelect = useCallback((nodeId: string, option: string) => {
		// 尝试通过 tRPC mutation 提交决策
		// fallback: 本地状态 + console.log
		console.log(
			`[CommandChainPanel] 决策选择: nodeId=${nodeId}, option=${option}`,
		);
		// TODO: 当 command-chain router 添加 resolveDecision mutation 后，替换为:
		// electronTrpc.commandChain.resolveDecision.useMutation().mutate({ nodeId, option });
	}, []);

	return (
		<div className="flex h-full flex-col">
			{/* 标题栏 */}
			<div className="flex-shrink-0 border-b px-4 py-3">
				<h3 className="text-sm font-semibold">{title}</h3>
			</div>

			{/* 内容区域 */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && !status ? (
					<LoadingState />
				) : error ? (
					<ErrorState
						message={error instanceof Error ? error.message : "未知错误"}
					/>
				) : !status ? (
					<EmptyState />
				) : (
					<div className="space-y-4 py-3">
						{/* 步骤进度列表 */}
						<section>
							<h4 className="mb-2 px-4 text-xs font-medium text-muted-foreground">
								步骤进度
							</h4>
							{status.steps && status.steps.length > 0 ? (
								<ul className="space-y-0.5">
									{status.steps.map((step) => (
										<StepItem key={step.id} step={step} />
									))}
								</ul>
							) : (
								<p className="px-4 text-xs text-muted-foreground">暂无步骤</p>
							)}
						</section>

						{/* 决策节点 */}
						{status.decisionNodes && status.decisionNodes.length > 0 && (
							<section>
								<h4 className="mb-2 px-4 text-xs font-medium text-muted-foreground">
									决策节点
								</h4>
								<div className="space-y-2 px-4">
									{status.decisionNodes.map((node) => (
										<DecisionNodeView
											key={node.id}
											node={node}
											onSelectOption={handleDecisionSelect}
										/>
									))}
								</div>
							</section>
						)}

						{/* 完成确认状态 */}
						{status.completionConfirmed && (
							<div className="mx-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
								所有步骤已确认完成
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
