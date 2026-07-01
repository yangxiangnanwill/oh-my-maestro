import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "bun:test";
import {
	isPathSafe,
	readCommandChainStatusFile,
	readProjectState,
} from "./parsers";
import {
	commandChainStatusSchema,
	projectStateSchema,
	ralphSessionSchema,
} from "./types";

// ---------------------------------------------------------------------------
// isPathSafe
// ---------------------------------------------------------------------------

describe("isPathSafe", () => {
	it("returns true for a normal absolute path", () => {
		expect(isPathSafe("C:\\Users\\test\\project")).toBe(true);
	});

	it("returns false for empty string", () => {
		expect(isPathSafe("")).toBe(false);
	});

	it("returns false for null byte injection", () => {
		expect(isPathSafe("C:\\Users\0\\evil")).toBe(false);
	});

	it("returns false for path traversal with .. segment", () => {
		expect(isPathSafe("C:\\Users\\..\\etc")).toBe(false);
	});

	it("returns false for forward-slash traversal", () => {
		expect(isPathSafe("/home/../etc")).toBe(false);
	});

	it("returns false for UNC path with traversal", () => {
		expect(isPathSafe("\\\\server\\share\\..\\etc")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// readProjectState
// ---------------------------------------------------------------------------

describe("readProjectState", () => {
	const tmpDir = join(tmpdir(), "workflow-state-test-project");

	it("returns uninitialized when .workflow/state.json does not exist", async () => {
		const result = await readProjectState(tmpDir);
		expect(result).toEqual({ uninitialized: true });
	});

	it("parses a valid state.json", async () => {
		const validState = {
			initialized: true,
			project: { name: "Test", description: "Test project" },
			current_milestone: "M1",
			milestones: [
				{
					id: "M1",
					name: "Milestone 1",
					status: "active",
					phases: [1],
				},
			],
			artifacts: [],
			status: "active",
		};

		await mkdir(join(tmpDir, ".workflow"), { recursive: true });
		await writeFile(
			join(tmpDir, ".workflow", "state.json"),
			JSON.stringify(validState),
			"utf-8",
		);

		try {
			const result = await readProjectState(tmpDir);
			expect(result).not.toEqual({ uninitialized: true });
			if ("initialized" in result) {
				expect(result.initialized).toBe(true);
				if (result.project) {
					expect(result.project.name).toBe("Test");
				}
				expect(result.current_milestone).toBe("M1");
			}
		} finally {
			await rm(join(tmpDir, ".workflow"), { recursive: true, force: true });
		}
	});

	it("returns uninitialized for invalid JSON", async () => {
		await mkdir(join(tmpDir, ".workflow"), { recursive: true });
		await writeFile(
			join(tmpDir, ".workflow", "state.json"),
			"not json at all",
			"utf-8",
		);

		try {
			const result = await readProjectState(tmpDir);
			expect(result).toEqual({ uninitialized: true });
		} finally {
			await rm(join(tmpDir, ".workflow"), { recursive: true, force: true });
		}
	});

	it("returns uninitialized for JSON that does not match schema", async () => {
		await mkdir(join(tmpDir, ".workflow"), { recursive: true });
		await writeFile(
			join(tmpDir, ".workflow", "state.json"),
			JSON.stringify({ wrong: "shape" }),
			"utf-8",
		);

		try {
			const result = await readProjectState(tmpDir);
			expect(result).toEqual({ uninitialized: true });
		} finally {
			await rm(join(tmpDir, ".workflow"), { recursive: true, force: true });
		}
	});

	it("returns uninitialized for unsafe path with .. traversal", async () => {
		const result = await readProjectState("C:\\Users\\..\\etc");
		expect(result).toEqual({ uninitialized: true });
	});

	// 用真实 .workflow/state.json 做 schema regression
	it("parses real .workflow/state.json from project root", async () => {
		// 项目根目录的真实 state.json
		const projectRoot = join(import.meta.dir, "..", "..", "..", "..", "..");
		const result = await readProjectState(projectRoot);
		expect(result).not.toEqual({ uninitialized: true });
		if ("initialized" in result) {
			expect(result.initialized).toBe(true);
			expect(result.project).toBeDefined();
			// 验证 milestone_history 中有结构化数据
			if (result.milestones) {
				expect(result.milestones.length).toBeGreaterThan(0);
				const first = result.milestones[0];
				expect(first.id).toBeTruthy();
				expect(first.name).toBeTruthy();
			}
		}
	});
});

// ---------------------------------------------------------------------------
// readCommandChainStatusFile
// ---------------------------------------------------------------------------

describe("readCommandChainStatusFile", () => {
	const tmpDir = join(tmpdir(), "workflow-state-test-cc");

	it("returns null when status.json does not exist", async () => {
		const result = await readCommandChainStatusFile(tmpDir);
		expect(result).toBeNull();
	});

	it("parses a valid status.json from cwd", async () => {
		const validStatus = {
			steps: [
				{
					id: "step-1",
					label: "Step 1",
					status: "completed",
				},
			],
			decisionNodes: [],
			completionConfirmed: false,
		};

		await mkdir(tmpDir, { recursive: true });
		await writeFile(
			join(tmpDir, "status.json"),
			JSON.stringify(validStatus),
			"utf-8",
		);

		try {
			const result = await readCommandChainStatusFile(tmpDir);
			expect(result).not.toBeNull();
			expect(result?.steps).toHaveLength(1);
			expect(result?.steps[0].id).toBe("step-1");
		} finally {
			await rm(join(tmpDir, "status.json"), { force: true });
		}
	});

	it("parses status.json from chains/singles/ fallback", async () => {
		const validStatus = {
			steps: [
				{
					id: "s1",
					label: "S1",
					status: "pending",
				},
			],
			decisionNodes: [],
			completionConfirmed: false,
		};

		await mkdir(join(tmpDir, "chains", "singles"), { recursive: true });
		await writeFile(
			join(tmpDir, "chains", "singles", "status.json"),
			JSON.stringify(validStatus),
			"utf-8",
		);

		try {
			const result = await readCommandChainStatusFile(tmpDir);
			expect(result).not.toBeNull();
			expect(result?.steps[0].status).toBe("pending");
		} finally {
			await rm(join(tmpDir, "chains"), { recursive: true, force: true });
		}
	});

	it("returns null for invalid JSON", async () => {
		await mkdir(tmpDir, { recursive: true });
		await writeFile(join(tmpDir, "status.json"), "broken", "utf-8");

		try {
			const result = await readCommandChainStatusFile(tmpDir);
			expect(result).toBeNull();
		} finally {
			await rm(join(tmpDir, "status.json"), { force: true });
		}
	});

	it("returns null for unsafe path", async () => {
		const result = await readCommandChainStatusFile("C:\\Users\\..\\etc");
		expect(result).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Zod schema smoke tests
// ---------------------------------------------------------------------------

describe("projectStateSchema", () => {
	it("parses a minimal valid state", () => {
		const result = projectStateSchema.parse({ initialized: true });
		expect(result.initialized).toBe(true);
	});

	it("parses a full state with milestones and artifacts including extra fields", () => {
		const data = {
			initialized: true,
			project: { name: "Test", description: "Desc" },
			current_milestone: "M1",
			milestones: [
				{
					id: "M1",
					type: "standard",
					name: "Milestone 1",
					status: "active",
					phases: [1],
					phase_slugs: { "1": "phase-one" },
					roadmap_ref: null,
					created_at: "2026-06-21T08:00:00+08:00",
				},
			],
			artifacts: [
				{
					id: "ANL-001",
					type: "analyze",
					scope: "micro",
					status: "completed",
					phase: 1,
					milestone: "M1",
					path: "scratch/20260621-analyze",
					depends_on: "ANL-000", // string variant
					harvested: false,
					created_at: "2026-06-21T09:30:00+08:00",
				},
				{
					id: "EXC-010",
					type: "execute",
					status: "completed",
					milestone: "F2",
					phase: 2,
					path: "scratch/20260623-plan-P2",
					depends_on: ["PLN-020"],
					gap_mode: true,
					tasks_completed: 3,
					tasks_total: 3,
				},
			],
			status: "active",
		};
		const result = projectStateSchema.parse(data);
		expect(result.milestones).toHaveLength(1);
		expect(result.artifacts).toHaveLength(2);
		// string depends_on
		if (result.artifacts?.[0].depends_on) {
			expect(typeof result.artifacts?.[0].depends_on).toBe("string");
		}
		// array depends_on
		if (result.artifacts?.[1].depends_on) {
			expect(Array.isArray(result.artifacts?.[1].depends_on)).toBe(true);
		}
	});

	it("rejects an invalid milestone status", () => {
		expect(() =>
			projectStateSchema.parse({
				initialized: true,
				milestones: [{ id: "M1", name: "M1", status: "unknown", phases: [1] }],
			}),
		).toThrow();
	});
});

describe("commandChainStatusSchema", () => {
	it("parses a valid command chain status", () => {
		const data = {
			steps: [
				{
					id: "step-1",
					label: "Step 1",
					status: "running",
					startedAt: "2026-06-21T10:00:00Z",
				},
			],
			decisionNodes: [
				{
					id: "dn-1",
					label: "Decision",
					question: "Which option?",
					options: ["A", "B"],
					resolved: false,
				},
			],
			completionConfirmed: false,
		};
		const result = commandChainStatusSchema.parse(data);
		expect(result.steps).toHaveLength(1);
		expect(result.decisionNodes).toHaveLength(1);
	});
});

describe("ralphSessionSchema", () => {
	it("parses a minimal ralph session", () => {
		const data = { session_id: "session-123" };
		const result = ralphSessionSchema.parse(data);
		expect(result.session_id).toBe("session-123");
	});

	it("parses a full ralph session", () => {
		const data = {
			session_id: "maestro-20260621-144200",
			status: "cancelled",
			phase: 1,
			milestone: "M1",
			active_step_index: null,
			intent: "continue",
			task_type: "state_continue",
			chain_name: "test",
			auto_mode: false,
			cli_tool: "claude",
		};
		const result = ralphSessionSchema.parse(data);
		expect(result.status).toBe("cancelled");
		expect(result.phase).toBe(1);
	});
});
