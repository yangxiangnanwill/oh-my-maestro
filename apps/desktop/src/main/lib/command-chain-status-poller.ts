import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

/** status.json 中单个步骤的定义 */
export interface CommandChainStep {
	id: string;
	label: string;
	status: "pending" | "running" | "completed" | "failed" | "skipped";
	startedAt?: string;
	completedAt?: string;
	error?: string;
}

/** status.json 中决策节点的定义 */
export interface CommandChainDecisionNode {
	id: string;
	label: string;
	question: string;
	options: string[];
	selectedOption?: string;
	resolved: boolean;
}

/** status.json 完整结构 */
export interface CommandChainStatus {
	steps: CommandChainStep[];
	decisionNodes: CommandChainDecisionNode[];
	completionConfirmed: boolean;
}

/**
 * 路径安全校验：检查是否包含路径遍历（..）或空字节注入。
 * 使用 resolve() 展开后按 sep 分割检查 ".." 段，替代无效的 resolve===normalize 比较。
 */
function isPathSafe(cwd: string): boolean {
	if (!cwd || cwd.includes("\0")) {
		return false;
	}
	const segments = resolve(cwd).split(sep);
	return !segments.includes("..");
}

/**
 * 无状态异步读取指定工作目录下的 status.json 文件，解析为 CommandChainStatus。
 * 若文件不存在、路径无效或解析失败则返回 null。
 *
 * @param cwd 工作目录（status.json 所在目录）
 * @returns 解析后的状态对象，或 null
 */
export async function readCommandChainStatus(
	cwd: string,
): Promise<CommandChainStatus | null> {
	// 路径校验：拒绝空字符串、路径遍历攻击和空字节注入
	if (!isPathSafe(cwd)) {
		return null;
	}

	try {
		const filePath = join(resolve(cwd), "status.json");
		const raw = await readFile(filePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		return validateStatus(parsed);
	} catch {
		return null;
	}
}

/** 自定义 type guard 替代 as Record<string, unknown> 断言 */
function isRecord(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** 校验并转换解析结果为 CommandChainStatus */
function validateStatus(data: unknown): CommandChainStatus | null {
	if (!isRecord(data)) {
		return null;
	}

	if (!Array.isArray(data.steps)) {
		return null;
	}

	const filteredSteps = data.steps
		.map((step: unknown) => {
			if (step === null || typeof step !== "object") {
				return null;
			}
			if (!isRecord(step)) {
				return null;
			}
			return {
				id: String(step.id ?? ""),
				label: String(step.label ?? ""),
				status: validateStepState(step.status),
				startedAt:
					typeof step.startedAt === "string" ? step.startedAt : undefined,
				completedAt:
					typeof step.completedAt === "string" ? step.completedAt : undefined,
				error: typeof step.error === "string" ? step.error : undefined,
			};
		})
		.filter((s): s is NonNullable<typeof s> => s !== null);
	const steps: CommandChainStep[] = filteredSteps;

	const filteredNodes = Array.isArray(data.decisionNodes)
		? data.decisionNodes
				.map((node: unknown) => {
					if (node === null || typeof node !== "object") {
						return null;
					}
					if (!isRecord(node)) {
						return null;
					}
					return {
						id: String(node.id ?? ""),
						label: String(node.label ?? ""),
						question: String(node.question ?? ""),
						options: Array.isArray(node.options)
							? node.options.map((o: unknown) => String(o))
							: [],
						selectedOption:
							typeof node.selectedOption === "string"
								? node.selectedOption
								: undefined,
						resolved: Boolean(node.resolved),
					};
				})
				.filter((n): n is NonNullable<typeof n> => n !== null)
		: [];
	const decisionNodes: CommandChainDecisionNode[] = filteredNodes;

	return {
		steps,
		decisionNodes,
		completionConfirmed: Boolean(data.completionConfirmed),
	};
}

function validateStepState(status: unknown): CommandChainStep["status"] {
	const validStatuses: CommandChainStep["status"][] = [
		"pending",
		"running",
		"completed",
		"failed",
		"skipped",
	];
	const s = String(status ?? "pending");
	return validStatuses.includes(s as CommandChainStep["status"])
		? (s as CommandChainStep["status"])
		: "pending";
}
