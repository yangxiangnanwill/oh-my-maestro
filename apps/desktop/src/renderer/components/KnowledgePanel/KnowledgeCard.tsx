import { ChevronDown, ChevronUp, ExternalLink, Tag } from "lucide-react";
import { useState } from "react";
import type { KnowledgeEntity } from "./types";

/** 实体类型 → 颜色映射 */
const typeColorMap: Record<KnowledgeEntity["type"], string> = {
  command: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  skill: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  spec: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  knowhow: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  issue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/** 实体类型 → 中文标签映射 */
const typeLabelMap: Record<KnowledgeEntity["type"], string> = {
  command: "命令",
  skill: "技能",
  spec: "规范",
  knowhow: "知识",
  issue: "问题",
};

/** 相关度分数 → 进度条颜色 */
function scoreColor(score: number): string {
  if (score >= 0.8) return "bg-green-500";
  if (score >= 0.6) return "bg-amber-500";
  return "bg-muted-foreground/40";
}

/** 格式化分数为百分比字符串 */
function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

interface KnowledgeCardProps {
  entity: KnowledgeEntity;
  keywords?: string[];
}

/**
 * 高亮文本中匹配的关键词。
 * 匹配结果用 <mark> 标签包裹。
 */
function highlightKeywords(text: string, keywords: string[]) {
  if (keywords.length === 0) return text;

  // 构建正则，按关键词长度降序排列避免短词优先匹配
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const pattern = sorted
    .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isKeyword = sorted.some(
      (kw) => kw.toLowerCase() === part.toLowerCase(),
    );
    return isKeyword ? (
      <mark
        key={`${part}-${i}`}
        className="rounded-sm bg-amber-200 px-0.5 dark:bg-amber-800/50"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${i}`}>{part}</span>
    );
  });
}

export function KnowledgeCard({ entity, keywords = [] }: KnowledgeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const typeColor = typeColorMap[entity.type] ?? typeColorMap.spec;
  const typeLabel = typeLabelMap[entity.type] ?? entity.type;

  return (
    <div className="rounded-md border bg-card text-sm">
      {/* 卡片头部：始终可见 */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 focus:outline-none"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* 类型标签 */}
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${typeColor}`}
        >
          {typeLabel}
        </span>

        {/* 实体名称 */}
        <span className="flex-1 font-semibold truncate">
          {highlightKeywords(entity.name, keywords)}
        </span>

        {/* 关键词标签 */}
        {entity.matchedKeywords.length > 0 && (
          <span className="hidden sm:flex flex-shrink-0 items-center gap-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {entity.matchedKeywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground"
              >
                {kw}
              </span>
            ))}
            {entity.matchedKeywords.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{entity.matchedKeywords.length - 3}
              </span>
            )}
          </span>
        )}

        {/* 展开/收起图标 */}
        <span className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </button>

      {/* 相关度分数进度条 */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          相关度
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${scoreColor(entity.relevanceScore)}`}
            style={{ width: `${Math.round(entity.relevanceScore * 100)}%` }}
          />
        </div>
        <span className="flex-shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatScore(entity.relevanceScore)}
        </span>
      </div>

      {/* 展开详情 */}
      {expanded && (
        <div className="border-t px-3 py-2.5 space-y-3">
          {/* 关联节点 */}
          {entity.relatedNodes.length > 0 && (
            <div>
              <h5 className="mb-1.5 text-xs font-medium text-muted-foreground">
                关联节点
              </h5>
              <ul className="space-y-0.5">
                {entity.relatedNodes.map((node) => (
                  <li
                    key={node}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground/70" />
                    <span className="text-muted-foreground">{node}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 无关联节点时的 fallback */}
          {entity.relatedNodes.length === 0 && (
            <p className="text-xs text-muted-foreground">暂无关联节点</p>
          )}
        </div>
      )}
    </div>
  );
}
