import { GitBranch } from "lucide-react";
import type { DecisionNode } from "./types";

interface DecisionNodeViewProps {
  node: DecisionNode;
  onSelectOption?: (nodeId: string, option: string) => void;
}

export function DecisionNodeView({ node, onSelectOption }: DecisionNodeViewProps) {
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
            const baseClass =
              "rounded px-2 py-1 text-xs w-full text-left transition-colors duration-150";
            const selectedClass =
              "bg-purple-100 font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
            const unselectedClass =
              "bg-muted/50 text-muted-foreground";

            // 已决策节点：只读展示
            if (node.resolved) {
              return (
                <li
                  key={`${node.id}-option-${index}`}
                  className={`${baseClass} ${
                    isSelected ? selectedClass : unselectedClass
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
            }

            // 未决策节点：可点击按钮
            return (
              <li key={`${node.id}-option-${index}`}>
                <button
                  type="button"
                  onClick={() => onSelectOption?.(node.id, option)}
                  className={`${baseClass} cursor-pointer ${
                    isSelected ? selectedClass : unselectedClass
                  } focus:outline-none focus:ring-2 focus:ring-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20`}
                >
                  {option}
                  {isSelected && (
                    <span className="ml-1.5 text-purple-600 dark:text-purple-400">
                      ← 当前结论
                    </span>
                  )}
                </button>
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
