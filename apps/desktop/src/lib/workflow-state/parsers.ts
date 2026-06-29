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
 * 与 command-chain-status-poller.ts 和 maestro/index.ts 保持一致逻辑。
 */
export function isPathSafe(path: string): boolean {
	if (!path || path.includes("\0")) {
		return false;
	}
	const segments = resolve(path).split(sep);
	return !segments.includes("..");
}

// ---------------------------------------------------------------------------
// Project State Parser
// ---------------------------------------------------------------------------

/** 未初始化状态的默认值 */
const UNINITIALIZED_STATE: ProjectState = { initialized: false };

/**
 * 读取并解析 .workflow/state.json。
 *
 * 三种失败场景均返回 { initialized: false }：
 * 1. 文件不存在（ENOENT）
 * 2. 文件内容不是合法 JSON
 * 3. JSON 结构不匹配 projectStateSchema
 */
export async function readProjectState(cwd: string): Promise<ProjectState> {
	if (!isPathSafe(cwd)) {
		return UNINITIALIZED_STATE;
	}

	const filePath = resolve(cwd, ".workflow", "state.json");

	try {
		const raw = await readFile(filePath, "utf-8");
		const parsed: unknown = JSON.parse(raw);
		return projectStateSchema.parse(parsed);
	} catch {
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

	for (const filePath of candidates) {
		try {
			const raw = await readFile(filePath, "utf-8");
			const parsed: unknown = JSON.parse(raw);
			return commandChainStatusSchema.parse(parsed);
		} catch {
			continue;
		}
	}

	return null;
}
