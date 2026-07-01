import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { useState } from "react";
import type { DimensionScore } from "./types";

interface ScoreCardProps {
	dimension: DimensionScore;
}

/**
 * 单个维度评分卡。
 * 显示维度名称、星级评分（1-5 填充/空心 Star 图标）、置信度进度条、
 * 可展开的 evidence 文本列表。
 */
export function ScoreCard({ dimension }: ScoreCardProps) {
	const [expanded, setExpanded] = useState(false);
	const { name, score, confidence, evidence } = dimension;

	return (
		<div className="rounded-md border bg-card px-4 py-3 text-sm">
			{/* 标题 + 展开按钮 */}
			<button
				type="button"
				className="flex w-full items-center justify-between text-left"
				onClick={() => setExpanded((v) => !v)}
				aria-expanded={expanded}
			>
				<span className="font-semibold">{name}</span>
				<span className="flex items-center gap-1 text-muted-foreground">
					{expanded ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</span>
			</button>

			{/* 星级评分：1-5 星 */}
			<div
				className="mt-2 flex items-center gap-0.5"
				aria-label={`${name} 评分: ${score}/5`}
			>
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`h-4 w-4 ${
							star <= score
								? "fill-amber-400 text-amber-400"
								: "fill-none text-muted-foreground/30"
						}`}
					/>
				))}
				<span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
					{score}/5
				</span>
			</div>

			{/* 置信度进度条 */}
			<div className="mt-2 flex items-center gap-2">
				<span className="text-xs text-muted-foreground">置信度</span>
				<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-blue-500 transition-all"
						style={{ width: `${confidence}%` }}
					/>
				</div>
				<span className="text-xs tabular-nums text-muted-foreground">
					{confidence}%
				</span>
			</div>

			{/* 可展开 evidence */}
			{expanded && evidence.length > 0 && (
				<ul className="mt-3 space-y-1 border-t pt-2">
					{evidence.map((item, idx) => (
						<li
							key={`${name}-evidence-${idx}`}
							className="text-xs text-muted-foreground leading-relaxed"
						>
							{item}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
