import type { AnalyzeResult } from "lib/trpc/routers/maestro";

/** 维度评分（UI 映射层） */
export interface DimensionScore {
  /** 维度名称，如 Feasibility / Impact / Risk */
  name: string;
  /** 1-5 星级评分 */
  score: number;
  /** 置信度百分比 (0-100) */
  confidence: number;
  /** 评分依据文本列表 */
  evidence: string[];
}

/** 风险矩阵条目（UI 映射层） */
export interface RiskItem {
  id: string;
  description: string;
  /** 概率 1-5 */
  probability: number;
  /** 影响 1-5 */
  impact: number;
  mitigation: string;
}

/** 分析结果（UI 映射层） */
export interface AnalysisResult {
  dimensions: DimensionScore[];
  risks: RiskItem[];
  /** 总体判定文本，如 "GO" / "CONDITIONAL_GO" / "NO-GO" */
  overallVerdict: string;
  /** 总体置信度 (0-100) */
  overallConfidence: number;
  /** 主题 */
  topic: string;
  /** 时间戳 */
  timestamp: string;
  /** 建议列表 */
  recommendations: string[];
}

/**
 * 将后端 AnalyzeResult 转换为 UI AnalysisResult。
 * 处理字段映射：score(0-10)→星级(1-5)、severity/likelihood→impact/probability 等。
 */
export function mapAnalyzeResult(raw: AnalyzeResult): AnalysisResult {
  return {
    topic: raw.topic,
    timestamp: raw.timestamp,
    overallConfidence: Math.round(raw.overallScore * 10), // 0-10 → 0-100
    overallVerdict: mapOverallVerdict(raw.overallScore),
    recommendations: raw.recommendations,
    dimensions: raw.dimensions.map((d) => ({
      name: d.dimension,
      score: Math.max(1, Math.min(5, Math.round(d.score / 2))), // 0-10 → 1-5
      confidence: Math.round(d.score * 10), // 0-10 → 0-100
      evidence: [d.summary, ...d.details],
    })),
    risks: raw.risks.map((r) => ({
      id: r.id,
      description: r.description,
      probability: mapLikelihoodToNumber(r.likelihood),
      impact: mapSeverityToNumber(r.severity),
      mitigation: r.mitigation ?? "",
    })),
  };
}

/** 0-10 分数 → 总体判定文本 */
function mapOverallVerdict(score: number): string {
  if (score >= 7) return "GO";
  if (score >= 4) return "CONDITIONAL_GO";
  return "NO-GO";
}

/** likelihood 文本 → 1-5 概率 */
function mapLikelihoodToNumber(l: string): number {
  switch (l) {
    case "low":
      return 2;
    case "medium":
      return 3;
    case "high":
      return 5;
    default:
      return 1;
  }
}

/** severity 文本 → 1-5 影响 */
function mapSeverityToNumber(s: string): number {
  switch (s) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 4;
    case "critical":
      return 5;
    default:
      return 1;
  }
}

/** AnalysisPanel props */
export interface AnalysisPanelProps {
  /** 工作目录路径，用于 tRPC query */
  cwd: string;
  /** 分析主题，可选 */
  topic?: string;
  /** 面板标题，默认 "分析结果" */
  title?: string;
}
