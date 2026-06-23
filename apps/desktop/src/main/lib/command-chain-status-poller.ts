import { readFile } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";

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
 * 无状态异步读取指定工作目录下的 status.json 文件，解析为 CommandChainStatus。
 * 若文件不存在、路径无效或解析失败则返回 null。
 *
 * @param cwd 工作目录（status.json 所在目录）
 * @returns 解析后的状态对象，或 null
 */
export async function readCommandChainStatus(
	cwd: string,
): Promise<CommandChainStatus | null> {
	// 路径校验：拒绝空字符串和路径遍历攻击
	const resolved = resolve(cwd);
	const normalized = normalize(cwd);
	if (resolved !== normalized || !normalized) {
		return null;
	}

	try {
		const filePath = join(normalized, "status.json");
		const raw = await readFile(filePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		return validateStatus(parsed);
	} catch {
		return null;
	}
}

/** 校验并转换解析结果为 CommandChainStatus */
function validateStatus(data: unknown): CommandChainStatus | null {
	if (data === null || typeof data !== "object") {
		return null;
	}

	const obj = data as Record<string, unknown>;

	if (!Array.isArray(obj.steps)) {
		return null;
	}

	const steps: CommandChainStep[] = obj.steps.map((step: unknown) => {
		const s = step as Record<string, unknown>;
		return {
			id: String(s.id ?? ""),
			label: String(s.label ?? ""),
			status: validateStepState(s.status),
			startedAt: typeof s.startedAt === "string" ? s.startedAt : undefined,
			completedAt:
				typeof s.completedAt === "string" ? s.completedAt : undefined,
			error: typeof s.error === "string" ? s.error : undefined,
		};
	});

	const decisionNodes: CommandChainDecisionNode[] = Array.isArray(
		obj.decisionNodes,
	)
		? obj.decisionNodes.map((node: unknown) => {
				const n = node as Record<string, unknown>;
				return {
					id: String(n.id ?? ""),
					label: String(n.label ?? ""),
					question: String(n.question ?? ""),
					options: Array.isArray(n.options)
						? n.options.map((o: unknown) => String(o))
						: [],
					selectedOption:
						typeof n.selectedOption === "string"
							? n.selectedOption
							: undefined,
					resolved: Boolean(n.resolved),
				};
			})
		: [];

	return {
		steps,
		decisionNodes,
		completionConfirmed: Boolean(obj.completionConfirmed),
	};
}

function validateStepState(
	status: unknown,
): CommandChainStep["status"] {
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
