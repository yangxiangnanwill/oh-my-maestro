import { execFile } from "node:child_process";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../..";
import { getWorkspace } from "../workspaces/utils/db-helpers";
import { getWorkspacePath } from "../workspaces/utils/worktree";
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
	isPathSafe,
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

const workspaceCwdInputSchema = z
	.object({
		cwd: z.string().optional().default(""),
		workspaceId: z.string().min(1, "workspaceId is required"),
	})
	.refine((input) => !input.cwd.trim() || isPathSafe(input.cwd), {
		message: "Invalid working directory path",
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

/** isPathSafe 已从 workflow-state 模块导入，这里仅保留 execMaestroCli */

/**
 * 执行 maestro CLI 命令并返回 stdout。
 * 超时 30 秒，防止子进程挂起。
 */
function execMaestroCli(args: string[], cwd: string): Promise<string> {
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

function resolveWorkspaceCwd(
	input: z.infer<typeof workspaceCwdInputSchema>,
): string {
	const workspace = getWorkspace(input.workspaceId);
	if (!workspace) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `Workspace ${input.workspaceId} not found`,
		});
	}
	const workspacePath = getWorkspacePath(workspace);
	if (!workspacePath || !isPathSafe(workspacePath)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Workspace has no valid working directory",
		});
	}
	if (input.cwd.trim() && input.cwd.trim() !== workspacePath) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Working directory does not match workspace",
		});
	}
	return workspacePath;
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

function normalizeResultType(raw: string): KgSearchResult["type"] {
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
function parseAnalyzeOutput(raw: string, topic: string): AnalyzeResult {
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

function parseRalphSessionOutput(raw: string) {
	const session = raw.match(/^session:\s*(.+)$/m)?.[1]?.trim();
	if (!session) {
		throw new Error("Unable to parse ralph session output");
	}

	const status = raw.match(/^status:\s*(.+)$/m)?.[1]?.trim();
	const lifecycle = raw.match(/^lifecycle:\s*(.+)$/m)?.[1]?.trim();
	const phaseRaw = raw.match(/^phase:\s*(.+)$/m)?.[1]?.trim();
	const milestoneRaw = raw.match(/^milestone:\s*(.+)$/m)?.[1]?.trim();
	const progress = raw.match(/^progress:\s*(.+)$/m)?.[1]?.trim();
	const activeStepRaw = raw.match(/^active_step_index:\s*(.+)$/m)?.[1]?.trim();

	const phaseMatch = phaseRaw?.match(/^\d+/);
	const activeStepMatch = activeStepRaw?.match(/^\d+/);

	return ralphSessionSchema.parse({
		session_id: session,
		status: status && status !== "(n/a)" ? status : undefined,
		lifecycle_position:
			lifecycle && lifecycle !== "(n/a)" ? lifecycle : undefined,
		phase: phaseMatch ? Number(phaseMatch[0]) : null,
		milestone: milestoneRaw && milestoneRaw !== "(n/a)" ? milestoneRaw : null,
		progress,
		active_step_index: activeStepMatch ? Number(activeStepMatch[0]) : null,
	});
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
						cwd: z.string().optional().default(""),
						workspaceId: z.string().min(1, "workspaceId is required"),
					}),
				)
				.output(z.array(kgSearchResultSchema))
				.query(async ({ input }) => {
					const cwd = resolveWorkspaceCwd(input);
					try {
						const raw = await execMaestroCli(["search", input.query], cwd);
						return parseSearchOutput(raw, input.query);
					} catch (err) {
						const message = err instanceof Error ? err.message : String(err);
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
						cwd: z.string().optional().default(""),
						workspaceId: z.string().min(1, "workspaceId is required"),
						topic: z.string().optional(),
					}),
				)
				.output(analyzeResultSchema)
				.query(async ({ input }) => {
					const topic = input.topic || "project";
					const cwd = resolveWorkspaceCwd(input);
					try {
						const raw = await execMaestroCli(["analyze", topic, "--json"], cwd);
						return parseAnalyzeOutput(raw, topic);
					} catch (err) {
						const message = err instanceof Error ? err.message : String(err);
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
				.input(workspaceCwdInputSchema)
				.output(
					z.union([
						projectStateSchema,
						z.object({ uninitialized: z.literal(true) }),
					]),
				)
				.query(async ({ input }) => {
					return readProjectState(resolveWorkspaceCwd(input));
				}),

			/** 执行 maestro ralph session，解析文本输出为 RalphSession 或 null */
			ralphSession: publicProcedure
				.input(workspaceCwdInputSchema)
				.output(ralphSessionSchema.nullable())
				.query(async ({ input }) => {
					const cwd = resolveWorkspaceCwd(input);
					try {
						const raw = await execMaestroCli(["ralph", "session"], cwd);
						return parseRalphSessionOutput(raw);
					} catch (err) {
						const message = err instanceof Error ? err.message : String(err);
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
										.includes(input.filter?.toLowerCase()),
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
