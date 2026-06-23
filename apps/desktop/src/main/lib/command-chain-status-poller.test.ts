import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readCommandChainStatus } from "./command-chain-status-poller";

describe("readCommandChainStatus", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = mkdtempSync(
			path.join(tmpdir(), "superset-command-chain-poller-"),
		);
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it("returns null when status.json does not exist", async () => {
		const result = await readCommandChainStatus(tempDir);
		expect(result).toBeNull();
	});

	it("returns parsed status after creating a valid status.json", async () => {
		const status = {
			steps: [
				{ id: "step-1", label: "初始化", status: "completed" },
				{ id: "step-2", label: "构建", status: "running" },
			],
			decisionNodes: [
				{
					id: "dn-1",
					label: "选择策略",
					question: "使用哪种策略？",
					options: ["A", "B"],
					selectedOption: "A",
					resolved: true,
				},
			],
			completionConfirmed: false,
		};
		writeFileSync(
			path.join(tempDir, "status.json"),
			JSON.stringify(status),
			"utf-8",
		);

		const result = await readCommandChainStatus(tempDir);

		expect(result).not.toBeNull();
		expect(result!.steps).toHaveLength(2);
		expect(result!.steps[0].id).toBe("step-1");
		expect(result!.steps[0].status).toBe("completed");
		expect(result!.steps[1].status).toBe("running");
		expect(result!.decisionNodes).toHaveLength(1);
		expect(result!.decisionNodes[0].resolved).toBe(true);
		expect(result!.completionConfirmed).toBe(false);
	});

	it("rejects invalid step status values (falls back to pending)", async () => {
		const status = {
			steps: [
				{ id: "s1", label: "步骤1", status: "invalid_status" },
				{ id: "s2", label: "步骤2", status: "completed" },
			],
			decisionNodes: [],
			completionConfirmed: false,
		};
		writeFileSync(
			path.join(tempDir, "status.json"),
			JSON.stringify(status),
			"utf-8",
		);

		const result = await readCommandChainStatus(tempDir);

		expect(result).not.toBeNull();
		// Invalid status should fall back to "pending"
		expect(result!.steps[0].status).toBe("pending");
		expect(result!.steps[1].status).toBe("completed");
	});

	it("returns null for non-object data", async () => {
		writeFileSync(
			path.join(tempDir, "status.json"),
			'"just a string"',
			"utf-8",
		);

		const result = await readCommandChainStatus(tempDir);
		expect(result).toBeNull();
	});

	it("returns null when steps is not an array", async () => {
		writeFileSync(
			path.join(tempDir, "status.json"),
			JSON.stringify({ steps: "not-an-array", decisionNodes: [], completionConfirmed: false }),
			"utf-8",
		);

		const result = await readCommandChainStatus(tempDir);
		expect(result).toBeNull();
	});

	it("handles missing decisionNodes gracefully", async () => {
		const status = {
			steps: [{ id: "s1", label: "步骤", status: "completed" }],
			completionConfirmed: true,
		};
		writeFileSync(
			path.join(tempDir, "status.json"),
			JSON.stringify(status),
			"utf-8",
		);

		const result = await readCommandChainStatus(tempDir);

		expect(result).not.toBeNull();
		expect(result!.decisionNodes).toEqual([]);
		expect(result!.completionConfirmed).toBe(true);
	});

	it("handles malformed JSON gracefully", async () => {
		writeFileSync(
			path.join(tempDir, "status.json"),
			"{ not valid json }",
			"utf-8",
		);

		const result = await readCommandChainStatus(tempDir);
		expect(result).toBeNull();
	});

	it("returns null for empty cwd", async () => {
		const result = await readCommandChainStatus("");
		expect(result).toBeNull();
	});
});
