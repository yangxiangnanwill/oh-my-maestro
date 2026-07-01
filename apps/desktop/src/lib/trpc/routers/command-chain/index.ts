import { resolve, sep } from "node:path";
import { z } from "zod";
import { publicProcedure, router } from "../..";
import { readCommandChainStatus } from "../../../../main/lib/command-chain-status-poller";

/** status.json 中步骤状态的 zod schema */
const stepStatusSchema = z.enum([
	"pending",
	"running",
	"completed",
	"failed",
	"skipped",
]);

/** status.json 中单个步骤的 zod schema */
const commandChainStepSchema = z.object({
	id: z.string(),
	label: z.string(),
	status: stepStatusSchema,
	startedAt: z.string().optional(),
	completedAt: z.string().optional(),
	error: z.string().optional(),
});

/** status.json 中决策节点的 zod schema */
const commandChainDecisionNodeSchema = z.object({
	id: z.string(),
	label: z.string(),
	question: z.string(),
	options: z.array(z.string()),
	selectedOption: z.string().optional(),
	resolved: z.boolean(),
});

/** status.json 完整结构的 zod schema */
const commandChainStatusSchema = z.object({
	steps: z.array(commandChainStepSchema),
	decisionNodes: z.array(commandChainDecisionNodeSchema),
	completionConfirmed: z.boolean(),
});

/** CommandChainStatus 输出类型 */
export type CommandChainStatusOutput = z.infer<typeof commandChainStatusSchema>;

export const createCommandChainRouter = () => {
	return router({
		getStatus: publicProcedure
			.input(
				z.object({
					cwd: z
						.string()
						.min(1)
						.refine(
							(val) => {
								// 路径安全校验：拒绝空字节注入 + 路径遍历（..）
								if (val.includes("\0")) {
									return false;
								}
								const segments = resolve(val).split(sep);
								return !segments.includes("..");
							},
							{ message: "Invalid working directory path" },
						),
				}),
			)
			.output(commandChainStatusSchema.nullable())
			.query(async ({ input }) => {
				return readCommandChainStatus(input.cwd);
			}),
	});
};
