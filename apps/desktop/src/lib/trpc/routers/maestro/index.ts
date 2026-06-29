import { execFile } from "node:child_process";
import { resolve, sep } from "node:path";
import { z } from "zod";
import { publicProcedure, router } from "../..";
import {
	COMMAND_CATEGORIES,
	COMMAND_REGISTRY,
	OUTPUT_KINDS,
	RISK_LEVELS,
	type CommandDefinition,
} from "../../commands";
import {
	projectStateSchema,
	ralphSessionSchema,
	readProjectState,
} from "../../workflow-state";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** 知识图谱搜索结果项 */
const kgSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["spec", "knowhow", "wiki", "code", "artifact"]),
  snippet: z.string(),
  score: z.number(),
  file: z.string().optional(),
  line: z.number().optional(),
  category: z.string().optional(),
});

/** 6 维分析评分 */
const dimensionScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(10),
  summary: z.string(),
  details: z.array(z.string()),
});

/** 风险矩阵条目 */
const riskEntrySchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  likelihood: z.enum(["low", "medium", "high"]),
  mitigation: z.string().optional(),
});

/** 分析结果 */
const analyzeResultSchema = z.object({
  topic: z.string(),
  timestamp: z.string(),
  overallScore: z.number().min(0).max(10),
  dimensions: z.array(dimensionScoreSchema),
  risks: z.array(riskEntrySchema),
  recommendations: z.array(z.string()),
  summary: z.string(),
});

/** 命令列表项 — 从 typed Command Registry 映射 */
const commandItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  description: z.string(),
  category: z.enum(COMMAND_CATEGORIES),
  cliCommand: z.string(),
  cliArgs: z.array(z.string()),
  outputKind: z.enum(OUTPUT_KINDS),
  riskLevel: z.enum(RISK_LEVELS),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type KgSearchResult = z.infer<typeof kgSearchResultSchema>;
export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;
export type CommandItem = z.infer<typeof commandItemSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * 路径安全校验：拒绝空字节注入 + 路径遍历（..）
 */
function validateCwd(cwd: string): boolean {
  if (cwd.includes("\0")) return false;
  const segments = resolve(cwd).split(sep);
  return !segments.includes("..");
}

/**
 * 执行 maestro CLI 命令并返回 stdout。
 * 超时 30 秒，防止子进程挂起。
 */
function execMaestroCli(
  args: string[],
  cwd: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "maestro",
      args,
      {
        cwd,
        encoding: "utf-8",
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024, // 10 MB
        env: {
          ...process.env,
          NO_COLOR: "1", // 禁用 ANSI 颜色，方便解析
        } as Record<string, string>,
      },
      (error, stdout, stderr) => {
        if (error) {
          // 优先使用 stderr 中的错误信息
          const message = stderr?.trim() || error.message;
          reject(new Error(`maestro CLI error: ${message}`));
          return;
        }
        resolve(stdout.trim());
      },
    );

    // 防止子进程挂起
    child.on("error", (err) => {
      reject(new Error(`Failed to spawn maestro: ${err.message}`));
    });
  });
}

/**
 * 解析 maestro search 的文本输出为结构化结果。
 * 预期格式：每行一个结果，用 tab 分隔字段。
 * 如果无法解析，返回原始文本作为单个结果。
 */
function parseSearchOutput(raw: string, query: string): KgSearchResult[] {
  if (!raw) return [];

  const lines = raw.split("\n").filter(Boolean);
  const results: KgSearchResult[] = [];

  for (const line of lines) {
    // 尝试 tab 分隔格式: id\ttitle\ttype\tsnippet\tscore
    const parts = line.split("\t");
    if (parts.length >= 4) {
      results.push({
        id: parts[0] || `result-${results.length}`,
        title: parts[1] || "Untitled",
        type: normalizeResultType(parts[2]),
        snippet: parts[3] || "",
        score: parseFloat(parts[4]) || 0,
        file: parts[5] || undefined,
        line: parts[6] ? parseInt(parts[6], 10) : undefined,
        category: parts[7] || undefined,
      });
    } else {
      // 回退：整行作为 snippet
      results.push({
        id: `result-${results.length}`,
        title: query,
        type: "code",
        snippet: line,
        score: 0,
      });
    }
  }

  return results;
}

function normalizeResultType(
  raw: string,
): KgSearchResult["type"] {
  const normalized = raw.toLowerCase().trim();
  const validTypes: KgSearchResult["type"][] = [
    "spec",
    "knowhow",
    "wiki",
    "code",
    "artifact",
  ];
  return validTypes.includes(normalized as KgSearchResult["type"])
    ? (normalized as KgSearchResult["type"])
    : "code";
}

/**
 * 解析 maestro analyze 的 JSON 输出。
 * 如果 maestro analyze 输出 JSON，直接解析；否则构造降级结果。
 */
function parseAnalyzeOutput(
  raw: string,
  topic: string,
): AnalyzeResult {
  try {
    const parsed = JSON.parse(raw);
    return analyzeResultSchema.parse(parsed);
  } catch {
    // 降级：返回原始文本作为 summary
    return {
      topic,
      timestamp: new Date().toISOString(),
      overallScore: 0,
      dimensions: [],
      risks: [],
      recommendations: [],
      summary: raw || `No analysis results available for "${topic}"`,
    };
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const createMaestroRouter = () => {
  return router({
    /**
     * 知识图谱搜索
     *
     * 执行 `maestro search <query>` 并返回结构化的 KG 搜索结果。
     * 支持跨 spec、knowhow、wiki、code 的语义搜索。
     */
    knowledge: router({
      search: publicProcedure
        .input(
          z.object({
            query: z.string().min(1, "Search query is required"),
            cwd: z.string().min(1).refine(validateCwd, {
              message: "Invalid working directory path",
            }),
          }),
        )
        .output(z.array(kgSearchResultSchema))
        .query(async ({ input }) => {
          try {
            const raw = await execMaestroCli(
              ["search", input.query],
              input.cwd,
            );
            return parseSearchOutput(raw, input.query);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : String(err);
            console.warn(
              `[maestro:knowledge.search] ${message} — returning empty results`,
            );
            return [];
          }
        }),
    }),

    /**
     * 分析结果
     *
     * 获取最新 maestro-analyze 结果（6 维评分 + 风险矩阵）。
     * 如果指定了 topic，执行 `maestro analyze <topic>`；
     * 否则尝试读取最近的分析缓存。
     */
    analyze: router({
      result: publicProcedure
        .input(
          z.object({
            cwd: z.string().min(1).refine(validateCwd, {
              message: "Invalid working directory path",
            }),
            topic: z.string().optional(),
          }),
        )
        .output(analyzeResultSchema)
        .query(async ({ input }) => {
          const topic = input.topic || "project";
          try {
            const raw = await execMaestroCli(
              ["analyze", topic, "--json"],
              input.cwd,
            );
            return parseAnalyzeOutput(raw, topic);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : String(err);
            console.warn(
              `[maestro:analyze.result] ${message} — returning empty analysis`,
            );
            return {
              topic,
              timestamp: new Date().toISOString(),
              overallScore: 0,
              dimensions: [],
              risks: [],
              recommendations: [],
              summary: `Analysis unavailable: ${message}`,
            };
          }
        }),
    }),

    /**
     * Workflow 状态查询
     *
     * 提供项目状态和 Ralph session 的 tRPC 端点。
     * commandChain.getStatus 保留在 command-chain router 不移动。
     */
    workflow: router({
      /** 读取 .workflow/state.json，返回 ProjectState 或 { uninitialized: true } */
      state: publicProcedure
        .input(
          z.object({
            cwd: z.string().min(1).refine(validateCwd, {
              message: "Invalid working directory path",
            }),
          }),
        )
        .output(
          z.union([
            projectStateSchema,
            z.object({ uninitialized: z.literal(true) }),
          ]),
        )
        .query(async ({ input }) => {
          return readProjectState(input.cwd);
        }),

      /** 执行 maestro ralph session --json，返回 RalphSession 或 null */
      ralphSession: publicProcedure
        .input(
          z.object({
            cwd: z.string().min(1).refine(validateCwd, {
              message: "Invalid working directory path",
            }),
          }),
        )
        .output(ralphSessionSchema.nullable())
        .query(async ({ input }) => {
          try {
            const raw = await execMaestroCli(
              ["ralph", "session", "--json"],
              input.cwd,
            );
            const parsed: unknown = JSON.parse(raw);
            return ralphSessionSchema.parse(parsed);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : String(err);
            console.warn(
              `[maestro:workflow.ralphSession] ${message} — returning null`,
            );
            return null;
          }
        }),
    }),

    /**
     * 命令列表
     *
     * 返回可用 Maestro command 列表，仅暴露 riskLevel="read" 命令。
     * 数据来源：typed Command Registry（COMMAND_REGISTRY）。
     * 支持按分类或关键词过滤。
     */
    commands: router({
      list: publicProcedure
        .input(
          z.object({
            filter: z.string().optional(),
          }),
        )
        .output(z.array(commandItemSchema))
        .query(async ({ input }) => {
          // 安全边界：运行时强制只返回 riskLevel="read" 命令，
          // 即使 registry 意外包含 write/destructive 条目也不会泄露
          const registry = COMMAND_REGISTRY.filter(
            (cmd: CommandDefinition) => cmd.riskLevel === "read",
          );
          const filtered = input.filter
            ? registry.filter(
                (cmd: CommandDefinition) =>
                  cmd.category === input.filter ||
                  cmd.id.includes(input.filter!) ||
                  cmd.label.includes(input.filter!) ||
                  cmd.description
                    .toLowerCase()
                    .includes(input.filter!.toLowerCase()),
              )
            : registry;
          return filtered.map((cmd: CommandDefinition) => ({
            id: cmd.id,
            name: cmd.id,
            label: cmd.label,
            description: cmd.description,
            category: cmd.category,
            cliCommand: cmd.cliCommand,
            cliArgs: cmd.cliArgs,
            outputKind: cmd.outputKind,
            riskLevel: cmd.riskLevel,
            notes: cmd.notes,
          }));
        }),
    }),
  });
};
