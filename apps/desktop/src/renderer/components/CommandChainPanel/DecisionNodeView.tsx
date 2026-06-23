import { GitBranch } from "lucide-react";
import type { DecisionNode } from "./types";

interface DecisionNodeViewProps {
  node: DecisionNode;
}

export function DecisionNodeView({ node }: DecisionNodeViewProps) {
  return (
    <div className="rounded-md border bg-card px-3 py-2.5 text-sm">
      {/* 决策类型标签 */}
      <div className="mb-2 flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-purple-500" />
        <span className="font-medium">{node.label}</span>
        {node.resolved ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
            已决策
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            待决策
          </span>
        )}
      </div>

      {/* 决策问题 */}
      <p className="mb-2 text-muted-foreground">{node.question}</p>

      {/* 选项列表 */}
      {node.options.length > 0 && (
        <ul className="space-y-1">
          {node.options.map((option, index) => {
            const isSelected = option === node.selectedOption;
            return (
              <li
                key={`${node.id}-option-${index}`}
                className={`rounded px-2 py-1 text-xs ${
                  isSelected
                    ? "bg-purple-100 font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {option}
                {isSelected && (
                  <span className="ml-1.5 text-purple-600 dark:text-purple-400">
                    ← 当前结论
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 无选项时的 fallback */}
      {node.options.length === 0 && (
        <p className="text-xs text-muted-foreground">暂无选项</p>
      )}
    </div>
  );
}
