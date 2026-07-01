import { z } from "zod";

// ---------------------------------------------------------------------------
// Command Chain (status.json / chains/singles/status.json)
// ---------------------------------------------------------------------------

/** status.json 中步骤状态 */
export const stepStatusSchema = z.enum([
	"pending",
	"running",
	"completed",
	"failed",
	"skipped",
]);
export type StepStatus = z.infer<typeof stepStatusSchema>;

/** status.json 中单个步骤 */
export const commandChainStepSchema = z.object({
	id: z.string(),
	label: z.string(),
	status: stepStatusSchema,
	startedAt: z.string().optional(),
	completedAt: z.string().optional(),
	error: z.string().optional(),
});
export type CommandChainStep = z.infer<typeof commandChainStepSchema>;

/** status.json 中决策节点 */
export const commandChainDecisionNodeSchema = z.object({
	id: z.string(),
	label: z.string(),
	question: z.string(),
	options: z.array(z.string()),
	selectedOption: z.string().optional(),
	resolved: z.boolean(),
});
export type CommandChainDecisionNode = z.infer<
	typeof commandChainDecisionNodeSchema
>;

/** status.json 完整结构 */
export const commandChainStatusSchema = z.object({
	steps: z.array(commandChainStepSchema),
	decisionNodes: z.array(commandChainDecisionNodeSchema),
	completionConfirmed: z.boolean(),
});
export type CommandChainStatus = z.infer<typeof commandChainStatusSchema>;

// ---------------------------------------------------------------------------
// Project State (.workflow/state.json)
// ---------------------------------------------------------------------------

/** 里程碑状态 */
export const milestoneStatusSchema = z.enum([
	"active",
	"archived",
	"completed",
]);
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>;

/** 制品类型 — 涵盖 Maestro-flow 全部 artifact 种类 */
export const artifactTypeSchema = z.enum([
	"analyze",
	"plan",
	"execute",
	"review",
	"test",
	"debug",
	"brainstorm",
	"grill",
	"blueprint",
	"roadmap",
	"verify",
]);
export type ArtifactType = z.infer<typeof artifactTypeSchema>;

/** 制品状态 — status.json 中已使用，也适用于 artifact 条目 */
export const artifactStatusSchema = z.enum([
	"completed",
	"running",
	"failed",
	"pending",
	"gaps_found",
]);
export type ArtifactStatus = z.infer<typeof artifactStatusSchema>;

/** 里程碑条目 — 基于 .workflow/state.json 实际结构 */
export const milestoneSchema = z.object({
	id: z.string(),
	type: z.string().optional(),
	name: z.string(),
	status: milestoneStatusSchema,
	phases: z.array(z.number()),
	phase_slugs: z.record(z.string(), z.string()).optional(),
	roadmap_ref: z.string().nullable().optional(),
	created_at: z.string().optional(),
	completed_at: z.string().optional(),
});
export type Milestone = z.infer<typeof milestoneSchema>;

/** 制品条目 — 基于 .workflow/state.json 实际结构 */
export const artifactSchema = z.object({
	id: z.string(),
	type: artifactTypeSchema,
	scope: z.string().optional(),
	status: artifactStatusSchema.optional(),
	phase: z.number().nullable().optional(),
	milestone: z.string().nullable().optional(),
	path: z.string().optional(),
	context_package: z.string().optional(),
	verdict: z.string().optional(),
	scope_verdict: z.string().optional(),
	depends_on: z.union([z.array(z.string()), z.string()]).optional(),
	harvested: z.boolean().optional(),
	created_at: z.string().optional(),
	completed_at: z.string().optional(),
	gap_mode: z.boolean().optional(),
	source_issues: z.array(z.string()).optional(),
	source_gaps: z.array(z.string()).optional(),
	source_review: z.string().optional(),
	source_debug: z.string().optional(),
	source_verification: z.string().optional(),
	tasks_completed: z.number().optional(),
	tasks_total: z.number().optional(),
});
export type Artifact = z.infer<typeof artifactSchema>;

/** 项目信息 */
export const projectInfoSchema = z.object({
	name: z.string(),
	description: z.string(),
});
export type ProjectInfo = z.infer<typeof projectInfoSchema>;

/**
 * .workflow/state.json 完整结构。
 *
 * 大量字段使用 optional/nullable — state.json 格式在不同 Maestro 版本间
 * 有差异，schema 需要足够宽松以兼容旧数据。
 */
export const projectStateSchema = z.object({
	initialized: z.boolean(),
	project: projectInfoSchema.optional(),
	current_milestone: z.string().nullable().optional(),
	milestones: z.array(milestoneSchema).optional(),
	artifacts: z.array(artifactSchema).optional(),
	status: z.enum(["active", "paused", "completed"]).optional(),
	accumulated_context: z
		.object({
			deferred: z.array(z.unknown()).optional(),
			key_decisions: z.array(z.string()).optional(),
		})
		.optional(),
	milestone_history: z.array(z.unknown()).optional(),
});
export type ProjectState = z.infer<typeof projectStateSchema>;

// ---------------------------------------------------------------------------
// Ralph Session
// ---------------------------------------------------------------------------

/** Ralph session 状态 — 来自 maestro ralph session --json */
export const ralphSessionSchema = z.object({
	session_id: z.string(),
	status: z
		.enum(["running", "completed", "paused", "failed", "cancelled"])
		.optional(),
	lifecycle_position: z.string().optional(),
	phase: z.number().nullable().optional(),
	milestone: z.string().nullable().optional(),
	progress: z.string().optional(),
	active_step_index: z.number().nullable().optional(),
	intent: z.string().optional(),
	task_type: z.string().optional(),
	chain_name: z.string().optional(),
	auto_mode: z.boolean().optional(),
	cli_tool: z.string().optional(),
});
export type RalphSession = z.infer<typeof ralphSessionSchema>;

// ---------------------------------------------------------------------------
// Unified Workflow State (what the UI consumes)
// ---------------------------------------------------------------------------

/** 统一工作流状态 — 聚合 project / commandChain / ralphSession */
export const workflowStateSchema = z.object({
	/** 项目状态，来自 .workflow/state.json；文件缺失时为 { uninitialized: true } */
	project: z.union([
		projectStateSchema,
		z.object({ uninitialized: z.literal(true) }),
	]),
	/** 命令链状态，来自 status.json；缺失时为 null */
	commandChain: commandChainStatusSchema.nullable(),
	/** Ralph session 状态，来自 maestro ralph session --json；不可用时为 null */
	ralphSession: ralphSessionSchema.nullable(),
});
export type WorkflowState = z.infer<typeof workflowStateSchema>;
