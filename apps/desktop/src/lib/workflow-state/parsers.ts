import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import {
	commandChainStatusSchema,
	projectStateSchema,
	type CommandChainStatus,
	type ProjectState,
} from "./types";

// ---------------------------------------------------------------------------
// Path Safety
// ---------------------------------------------------------------------------

/**
 * 路径安全校验：检查是否包含路径遍历（..）或空字节注入。
 * 检查输入字符串中的原始 .. segment（在 resolve 折叠之前）。
 */
export function isPathSafe(path: string): boolean {
	if (!path || path.includes("\0")) {
		return false;
	}
	// 在 resolve 之前检查原始路径中的 .. 段
	// resolve 会折叠 .. 但攻击者可能利用 UNC 路径或驱动器相对路径绕过
	const rawSegments = path.replace(/\\/g, "/").split("/");
	if (rawSegments.includes("..")) {
		return false;
	}
	// 二次确认：resolve 后也不应有 ..
	const resolved = resolve(path);
	if (resolved.includes("\0")) return false;
	const segments = resolved.split(sep);
	return !segments.includes("..");
}

// ---------------------------------------------------------------------------
// Project State Parser
// ---------------------------------------------------------------------------

/** 未初始化状态的默认值 — 与 workflowStateSchema.project union 一致 */
const UNINITIALIZED_STATE = { uninitialized: true as const };

/**
 * 读取并解析 .workflow/state.json。
 *
 * 失败场景均返回 { uninitialized: true }：
 * 1. 文件不存在（ENOENT）
 * 2. 文件内容不是合法 JSON
 * 3. JSON 结构不匹配 projectStateSchema
 *
 * 非 ENOENT 错误会通过 console.warn 保留可观测信号。
 */
export async function readProjectState(
	cwd: string,
): Promise<ProjectState | { uninitialized: true }> {
	if (!isPathSafe(cwd)) {
		return UNINITIALIZED_STATE;
	}

	const filePath = resolve(cwd, ".workflow", "state.json");

	try {
		const raw = await readFile(filePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		const result = projectStateSchema.safeParse(parsed);
		if (!result.success) {
			console.warn(
				`[workflow-state] Schema mismatch for ${filePath}:`,
				result.error.issues
					.slice(0, 3)
					.map((i) => `${i.path.join(".")}: ${i.message}`)
					.join("; "),
			);
			return UNINITIALIZED_STATE;
		}
		return result.data;
	} catch (err: unknown) {
		const code = (err as NodeJS.ErrnoException).code;
		if (code !== "ENOENT") {
			console.warn(
				`[workflow-state] Error reading ${filePath}:`,
				code ?? (err instanceof Error ? err.message : String(err)),
			);
		}
		return UNINITIALIZED_STATE;
	}
}

// ---------------------------------------------------------------------------
// Command Chain Status Parser
// ---------------------------------------------------------------------------

/**
 * 读取并解析 status.json。
 *
 * 依次尝试 cwd/status.json 和 cwd/chains/singles/status.json，
 * 全部缺失或无效时返回 null。
 *
 * 注意：此函数使用严格 Zod 解析，与 command-chain-status-poller.ts 的
 * 宽松 validateStatus() 行为不同。未来切换时需决定是否保留 coerce 行为。
 */
export async function readCommandChainStatusFile(
	cwd: string,
): Promise<CommandChainStatus | null> {
	if (!isPathSafe(cwd)) {
		return null;
	}

	const candidates = [
		resolve(cwd, "status.json"),
		resolve(cwd, "chains", "singles", "status.json"),
	];

	// 并行读取两个候选路径，取第一个成功的结果
	const results = await Promise.allSettled(
		candidates.map(async (filePath) => {
			const raw = await readFile(filePath, "utf-8");
			const parsed: unknown = JSON.parse(raw);
			const result = commandChainStatusSchema.safeParse(parsed);
			if (!result.success) {
				console.warn(
					`[workflow-state] Schema mismatch for ${filePath}:`,
					result.error.issues
						.slice(0, 3)
						.map((i) => `${i.path.join(".")}: ${i.message}`)
						.join("; "),
				);
				throw new Error("Schema mismatch");
			}
			return result.data;
		}),
	);

	for (const result of results) {
		if (result.status === "fulfilled") {
			return result.value;
		}
	}

	return null;
}
