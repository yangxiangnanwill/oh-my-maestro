import { useState } from "react";
import type { RiskItem } from "./types";

interface RiskMatrixProps {
  risks: RiskItem[];
}

/** 概率标签 (X 轴) */
const PROBABILITY_LABELS = ["极低", "低", "中", "高", "极高"];

/** 影响标签 (Y 轴) */
const IMPACT_LABELS = ["极低", "低", "中", "高", "极高"];

/**
 * 根据格子中的风险项数量返回背景色类名。
 * 0=灰, 1=绿, 2=黄, 3=橙, 4+=红
 */
function cellColorClass(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count === 1) return "bg-green-200 dark:bg-green-900/50";
  if (count === 2) return "bg-yellow-200 dark:bg-yellow-900/50";
  if (count === 3) return "bg-orange-200 dark:bg-orange-900/50";
  return "bg-red-300 dark:bg-red-900/60";
}

/** 构建 5x5 矩阵数据 */
function buildMatrix(risks: RiskItem[]): number[][] {
  const matrix: number[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => 0),
  );

  for (const risk of risks) {
    const col = Math.max(0, Math.min(4, risk.probability - 1));
    const row = Math.max(0, Math.min(4, risk.impact - 1));
    matrix[row][col] += 1;
  }

  return matrix;
}

/**
 * 5x5 风险矩阵热力图。
 * X 轴 = 概率 (1-5)，Y 轴 = 影响 (1-5)。
 * 每个格子显示风险项数量，背景色按 count 映射。
 * 点击格子可展开该格中的风险项列表。
 */
export function RiskMatrix({ risks }: RiskMatrixProps) {
  const matrix = buildMatrix(risks);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  /** 获取指定格子中的风险项 */
  function getRisksInCell(row: number, col: number): RiskItem[] {
    return risks.filter(
      (r) =>
        Math.max(0, Math.min(4, r.impact - 1)) === row &&
        Math.max(0, Math.min(4, r.probability - 1)) === col,
    );
  }

  return (
    <div className="space-y-2">
      {/* 标题 */}
      <h4 className="text-xs font-medium text-muted-foreground">风险矩阵</h4>

      {/* 图例 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-gray-100 dark:bg-gray-800" />
          无
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-200 dark:bg-green-900/50" />
          低
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-yellow-200 dark:bg-yellow-900/50" />
          中
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-orange-200 dark:bg-orange-900/50" />
          高
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-300 dark:bg-red-900/60" />
          极高
        </span>
      </div>

      {/* 矩阵网格 */}
      <div className="overflow-x-auto">
        <div className="inline-grid min-w-[280px] grid-cols-[auto_repeat(5,1fr)] gap-px rounded-md border bg-border text-xs">
          {/* 左上角空白 */}
          <div className="bg-card px-2 py-1.5 text-muted-foreground">
            影响 \ 概率
          </div>

          {/* X 轴标签 */}
          {PROBABILITY_LABELS.map((label, i) => (
            <div
              key={`prob-${i}`}
              className="bg-card px-2 py-1.5 text-center text-muted-foreground"
            >
              {label}
            </div>
          ))}

          {/* 矩阵行 */}
          {matrix.map((row, rowIdx) => (
            <>
              {/* Y 轴标签 */}
              <div
                key={`impact-${rowIdx}`}
                className="bg-card px-2 py-1.5 text-muted-foreground"
              >
                {IMPACT_LABELS[rowIdx]}
              </div>

              {/* 格子 */}
              {row.map((count, colIdx) => {
                const isSelected =
                  selectedCell?.row === rowIdx &&
                  selectedCell?.col === colIdx;
                const cellRisks = getRisksInCell(rowIdx, colIdx);

                return (
                  <button
                    key={`cell-${rowIdx}-${colIdx}`}
                    type="button"
                    className={`flex items-center justify-center px-2 py-2 font-mono tabular-nums transition-colors ${cellColorClass(count)} ${count > 0 ? "cursor-pointer hover:ring-2 hover:ring-blue-400" : "cursor-default"} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => {
                      if (count > 0) {
                        setSelectedCell(
                          isSelected
                            ? null
                            : { row: rowIdx, col: colIdx },
                        );
                      }
                    }}
                    aria-label={`概率 ${PROBABILITY_LABELS[colIdx]}，影响 ${IMPACT_LABELS[rowIdx]}，${count} 个风险`}
                  >
                    {count}
                  </button>
                );
              })}

              {/* 选中格子的风险项详情 */}
              {selectedCell?.row === rowIdx && (
                <div className="col-span-6 bg-card px-3 py-2">
                  <ul className="space-y-1">
                    {getRisksInCell(
                      selectedCell.row,
                      selectedCell.col,
                    ).map((risk) => (
                      <li
                        key={risk.id}
                        className="text-xs text-muted-foreground"
                      >
                        <span className="font-medium">
                          {risk.description}
                        </span>
                        {risk.mitigation && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            → {risk.mitigation}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
