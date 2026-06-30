import { AlertTriangle, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { KnowledgeCard } from "./KnowledgeCard";
import type {
  KnowledgeEntity,
  KnowledgeEntityType,
  KnowledgePanelProps,
} from "./types";

// ---------------------------------------------------------------------------
// 后端 tRPC 返回类型（来自 maestro/index.ts 的 kgSearchResultSchema）
// ---------------------------------------------------------------------------

interface KgSearchResultItem {
  id: string;
  title: string;
  type: "spec" | "knowhow" | "wiki" | "code" | "artifact";
  snippet: string;
  score: number;
  file?: string;
  line?: number;
  category?: string;
}

// ---------------------------------------------------------------------------
// 类型映射
// ---------------------------------------------------------------------------

/** 将后端 type 映射为 UI 实体类型 */
function mapType(raw: KgSearchResultItem["type"]): KnowledgeEntityType {
  const map: Record<KgSearchResultItem["type"], KnowledgeEntityType> = {
    spec: "spec",
    knowhow: "knowhow",
    wiki: "knowhow",
    code: "command",
    artifact: "issue",
  };
  return map[raw] ?? "spec";
}

/** 将后端搜索结果转换为 UI 实体 */
function toKnowledgeEntity(item: KgSearchResultItem): KnowledgeEntity {
  return {
    id: item.id,
    name: item.title,
    type: mapType(item.type),
    relevanceScore: item.score,
    matchedKeywords: item.category ? [item.category] : [],
    relatedNodes: item.file ? [item.file] : [],
  };
}

// ---------------------------------------------------------------------------
// 状态组件（四态渲染模式，遵循 CommandChainPanel 风格）
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <Search className="h-8 w-8" />
      <p>输入关键词搜索知识图谱</p>
      <p className="text-xs">支持搜索命令、技能、规范、知识和问题</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>搜索中...</span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-muted-foreground">搜索失败</p>
      <p className="max-w-[240px] text-xs text-red-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
          onClick={onRetry}
        >
          重试
        </button>
      )}
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
      <Search className="h-8 w-8" />
      <p>未找到与 "{query}" 相关的结果</p>
      <p className="text-xs">请尝试其他关键词</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

export function KnowledgePanel({
  cwd,
  workspaceId,
  placeholder = "搜索知识图谱...",
}: KnowledgePanelProps) {
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchText.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // tRPC query：仅在有查询词时发起请求
  const enabled = debouncedQuery.length > 0 && Boolean(workspaceId);
  const {
    data: rawResults,
    isLoading,
    error,
    refetch,
  } = electronTrpc.maestro.knowledge.search.useQuery(
    { query: debouncedQuery, cwd, workspaceId },
    { enabled },
  );

  // 将后端结果转换为 UI 实体
  const entities: KnowledgeEntity[] = useMemo(() => {
    if (!rawResults || rawResults.length === 0) return [];
    return rawResults.map(toKnowledgeEntity);
  }, [rawResults]);

  const handleClear = useCallback(() => {
    setSearchText("");
    setDebouncedQuery("");
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // 确定当前渲染状态
  const showLoading = isLoading && enabled;
  const showError = error && enabled;
  const showEmpty = !enabled;
  const showNoResults = enabled && !isLoading && !error && entities.length === 0;
  const showResults = enabled && !isLoading && !error && entities.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* 搜索栏 */}
      <div className="flex-shrink-0 border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full rounded-md border bg-background py-1.5 pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={placeholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText.length > 0 && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {showLoading && <LoadingState />}
        {showError && (
          <ErrorState
            message={
              error instanceof Error ? error.message : "未知错误"
            }
            onRetry={handleRetry}
          />
        )}
        {showEmpty && <EmptyState />}
        {showNoResults && <NoResultsState query={debouncedQuery} />}
        {showResults && (
          <div className="space-y-2 py-3">
            {/* 结果计数 */}
            <p className="px-4 text-xs text-muted-foreground">
              共 {entities.length} 条结果
            </p>
            {/* 知识卡片列表 */}
            <ul className="space-y-1.5 px-3">
              {entities.map((entity) => (
                <li key={entity.id}>
                  <KnowledgeCard
                    entity={entity}
                    keywords={
                      debouncedQuery ? [debouncedQuery] : []
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
