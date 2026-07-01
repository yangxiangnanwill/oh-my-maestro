import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join, resolve, sep } from "node:path";

const IS_DEV = process.env.NODE_ENV === "development";
const MAESTRO_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 1024 * 1024 * 5;

interface MaestroRunResult {
	ok: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	error?: string;
}

interface MaestroStateResult {
	ok: boolean;
	raw: string;
	path?: string;
	checkedPaths: string[];
	error?: string;
}

interface MaestroCodingSessionResult {
	ok: boolean;
	sessionId: string;
	sessionDir: string;
	statusPath: string;
	error?: string;
}

type RalphCompletionStatus =
	| "DONE"
	| "DONE_WITH_CONCERNS"
	| "NEEDS_RETRY"
	| "BLOCKED";

interface RalphStepSeed {
	skill: string;
	args: string;
	stage: string;
	scope: string;
	goalRef: string | null;
}

function validateCwd(cwd: unknown): string {
	if (typeof cwd !== "string" || cwd.trim().length === 0) {
		throw new Error("Project path is required");
	}
	if (cwd.includes("\0")) {
		throw new Error("Project path contains invalid characters");
	}
	const resolved = resolve(cwd);
	if (resolved.split(sep).includes("..")) {
		throw new Error("Project path is invalid");
	}
	if (!existsSync(resolved)) {
		throw new Error(`Project path does not exist: ${resolved}`);
	}
	return resolved;
}

function validateArgs(args: unknown): string[] {
	if (!Array.isArray(args) || args.length === 0) {
		throw new Error("Maestro command args are required");
	}
	if (!args.every((arg) => typeof arg === "string")) {
		throw new Error("Maestro command args must be strings");
	}
	const normalized = args as string[];
	const [command, subcommand] = normalized;
	const allowed =
		command === "search" ||
		command === "load" ||
		(command === "ralph" &&
			["check", "next", "session", "skills"].includes(subcommand ?? ""));
	if (!allowed) {
		throw new Error(`Unsupported Maestro command: ${normalized.join(" ")}`);
	}
	return normalized;
}

function validateTask(task: unknown): string {
	if (typeof task !== "string" || task.trim().length < 8) {
		throw new Error("Coding task must be at least 8 characters");
	}
	if (task.includes("\0")) {
		throw new Error("Coding task contains invalid characters");
	}
	return task.trim().slice(0, 2000);
}

function validateSessionId(sessionId: unknown): string | null {
	if (sessionId === undefined || sessionId === null || sessionId === "") {
		return null;
	}
	if (typeof sessionId !== "string") {
		throw new Error("Session id must be a string");
	}
	const normalized = sessionId.trim();
	if (!/^(ralph|maestro)-\d{8}-\d{6}$/.test(normalized)) {
		throw new Error(`Invalid session id: ${normalized}`);
	}
	return normalized;
}

function validateStepIndex(index: unknown): number {
	const parsed =
		typeof index === "number"
			? index
			: typeof index === "string"
				? Number(index)
				: Number.NaN;
	if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
		throw new Error("Step index must be an integer from 0 to 999");
	}
	return parsed;
}

function validateCompletionStatus(status: unknown): RalphCompletionStatus {
	if (
		status === "DONE" ||
		status === "DONE_WITH_CONCERNS" ||
		status === "NEEDS_RETRY" ||
		status === "BLOCKED"
	) {
		return status;
	}
	throw new Error("Invalid completion status");
}

function validateOptionalText(
	value: unknown,
	fieldName: string,
): string | null {
	if (value === undefined || value === null || value === "") {
		return null;
	}
	if (typeof value !== "string") {
		throw new Error(`${fieldName} must be a string`);
	}
	if (value.includes("\0")) {
		throw new Error(`${fieldName} contains invalid characters`);
	}
	return value.trim().slice(0, 2000);
}

function formatSessionTimestamp(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, "0");
	return [
		date.getFullYear(),
		pad(date.getMonth() + 1),
		pad(date.getDate()),
		"-",
		pad(date.getHours()),
		pad(date.getMinutes()),
		pad(date.getSeconds()),
	].join("");
}

function resolveAgentSkillPath(skill: string): string {
	const candidates = [
		join(homedir(), ".agents", "skills", skill, "SKILL.md"),
		join(homedir(), ".codex", "skills", skill, "SKILL.md"),
	];
	const found = candidates.find((candidate) => existsSync(candidate));
	if (!found) {
		throw new Error(`Required skill is not installed: ${skill}`);
	}
	return found;
}

function createExecutionStep(
	seed: RalphStepSeed,
	index: number,
): Record<string, unknown> {
	return {
		index,
		skill: seed.skill,
		args: seed.args,
		stage: seed.stage,
		scope: seed.scope,
		decision: null,
		retry_count: 0,
		max_retries: 0,
		command_scope: "global",
		command_path: resolveAgentSkillPath(seed.skill),
		milestone_id: null,
		source_artifact_ref: null,
		status: "pending",
		goal_ref: seed.goalRef,
		completion_confirmed: false,
		completion_status: null,
		completion_evidence: null,
		completed_at: null,
		deferred_reads: [],
		load: null,
	};
}

async function createCodingSession(
	cwd: string,
	task: string,
): Promise<MaestroCodingSessionResult> {
	const timestamp = formatSessionTimestamp(new Date());
	const sessionId = `ralph-${timestamp}`;
	const sessionDir = join(cwd, ".workflow", ".maestro", sessionId);
	const statusPath = join(sessionDir, "status.json");
	const quotedTask = JSON.stringify(task);

	const stepSeeds: RalphStepSeed[] = [
		{
			skill: "maestro-plan",
			args: `${quotedTask} --dir apps/desktop`,
			stage: "plan",
			scope: "standalone",
			goalRef: "G1",
		},
		{
			skill: "maestro-execute",
			args: `${quotedTask} --dir apps/desktop`,
			stage: "execute",
			scope: "standalone",
			goalRef: "G2",
		},
		{
			skill: "quality-review",
			args: `${quotedTask} --scope apps/desktop`,
			stage: "review",
			scope: "standalone",
			goalRef: "G3",
		},
		{
			skill: "quality-test",
			args: "apps/desktop",
			stage: "test",
			scope: "standalone",
			goalRef: "G4",
		},
		{
			skill: "maestro-milestone-complete",
			args: `${quotedTask} --scope apps/desktop`,
			stage: "milestone-complete",
			scope: "standalone",
			goalRef: null,
		},
	];

	const status = {
		session_id: sessionId,
		source: "ralph",
		status: "running",
		ralph_protocol_version: "1",
		active_step_index: null,
		intent: task,
		lifecycle_position: "plan",
		phase: null,
		phase_is_new: true,
		milestone: null,
		auto_mode: false,
		decomposition_owner: "ralph",
		quality_mode: "standard",
		planning_mode: "independent",
		scope_verdict: null,
		wants_roadmap: false,
		analyze_macro_id: null,
		blueprint_id: null,
		cli_tool: "claude",
		passed_gates: [],
		context: {
			issue_id: null,
			scratch_dir: null,
			plan_dir: null,
			analysis_dir: null,
			brainstorm_dir: null,
			blueprint_dir: null,
		},
		steps: stepSeeds.map((seed, index) => createExecutionStep(seed, index)),
		waves: [],
		current_step: 0,
		boundary_contract: {
			in_scope: [
				"apps/desktop/src/renderer",
				"apps/desktop/src/main",
				"apps/desktop/src/preload",
				"apps/desktop/src/lib",
			],
			out_of_scope: [
				"destructive shell execution",
				"unregistered command execution",
				"large dependency additions",
				"full architecture rewrite",
			],
			constraints: [
				"Use Bun",
				"Keep renderer-to-main boundaries explicit",
				"Prefer registry-backed Maestro commands",
				"Run typecheck and build before completion",
			],
			definition_of_done:
				"Desktop exposes a usable coding workflow entry with project cwd, task input, chain preview, Ralph session status, and explicit next-step execution.",
		},
		execution_criteria: [
			"Task input produces a valid Ralph protocol v1 session",
			"Session can be verified with maestro ralph check",
			"User explicitly triggers the next step",
			"bun run typecheck and bun run build pass",
		],
		task_decomposition: [
			{
				id: "G1",
				goal: "Plan the desktop coding workflow change",
				boundary: "apps/desktop only",
				done_when:
					"Plan identifies UI state, command boundary, and verification steps",
				evidence: ".workflow/scratch/*/plan.md",
				lifecycle: ["plan"],
				status: "pending",
				completion_confirmed: false,
				completed_at: null,
			},
			{
				id: "G2",
				goal: "Implement the desktop coding workflow",
				boundary: "Minimal renderer/main/preload changes",
				done_when:
					"User can create or continue a Ralph coding workflow from the desktop app",
				evidence: "apps/desktop source changes",
				lifecycle: ["execute"],
				status: "pending",
				completion_confirmed: false,
				completed_at: null,
			},
			{
				id: "G3",
				goal: "Review safety and product fit",
				boundary: "No unrelated refactor",
				done_when:
					"Review finds no blocking command safety or workflow defects",
				evidence: "review output",
				lifecycle: ["review"],
				status: "pending",
				completion_confirmed: false,
				completed_at: null,
			},
			{
				id: "G4",
				goal: "Verify build health",
				boundary: "apps/desktop checks",
				done_when: "typecheck and build pass",
				evidence: "bun run typecheck and bun run build output",
				lifecycle: ["test"],
				status: "pending",
				completion_confirmed: false,
				completed_at: null,
			},
		],
		task_decomposition_all_done: false,
	};

	await mkdir(sessionDir, { recursive: true });
	await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
	return { ok: true, sessionId, sessionDir, statusPath };
}

async function runRalphCommand(
	cwd: string,
	args: string[],
): Promise<MaestroRunResult> {
	return runExecutable("maestro", ["ralph", ...args], cwd);
}

async function readFirstWorkflowState(
	cwd: string,
): Promise<MaestroStateResult> {
	const candidates = [
		join(cwd, ".workflow", "state.json"),
		join(cwd, "status.json"),
		join(cwd, "chains", "singles", "status.json"),
	];

	for (const candidate of candidates) {
		try {
			const raw = await readFile(candidate, "utf8");
			return {
				ok: true,
				raw,
				path: candidate,
				checkedPaths: candidates,
			};
		} catch (error) {
			const code = (error as NodeJS.ErrnoException).code;
			if (code !== "ENOENT") {
				return {
					ok: false,
					raw: "",
					checkedPaths: candidates,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		}
	}

	return {
		ok: false,
		raw: "",
		checkedPaths: candidates,
		error:
			"未找到 workflow 状态文件。这个项目可能还没有初始化 .workflow/state.json；已同时检查 status.json 和 chains/singles/status.json。",
	};
}

function runExecutable(
	file: string,
	args: string[],
	cwd: string,
): Promise<MaestroRunResult> {
	return new Promise((resolveResult) => {
		execFile(
			file,
			args,
			{
				cwd,
				encoding: "utf8",
				timeout: MAESTRO_TIMEOUT_MS,
				maxBuffer: MAX_OUTPUT_BYTES,
				windowsHide: true,
				env: {
					...process.env,
					NO_COLOR: "1",
				},
			},
			(error, stdout, stderr) => {
				if (error) {
					const exitCode =
						typeof (error as NodeJS.ErrnoException & { code?: unknown })
							.code === "number"
							? (error as NodeJS.ErrnoException & { code: number }).code
							: null;
					resolveResult({
						ok: false,
						stdout: stdout ?? "",
						stderr: stderr ?? "",
						exitCode,
						error: error.message,
					});
					return;
				}
				resolveResult({
					ok: true,
					stdout: stdout ?? "",
					stderr: stderr ?? "",
					exitCode: 0,
				});
			},
		);
	});
}

function registerMaestroIpc() {
	ipcMain.handle("maestro:selectProject", async () => {
		const result = await dialog.showOpenDialog({
			properties: ["openDirectory"],
			title: "选择 Maestro-flow 项目目录",
		});
		if (result.canceled) return null;
		return result.filePaths[0] ?? null;
	});

	ipcMain.handle("maestro:checkCli", async () => {
		const locator = process.platform === "win32" ? "where" : "which";
		const result = await runExecutable(locator, ["maestro"], process.cwd());
		return {
			available: result.ok && result.stdout.trim().length > 0,
			path: result.stdout.trim().split(/\r?\n/)[0] ?? "",
			error: result.error || result.stderr.trim() || undefined,
		};
	});

	ipcMain.handle("maestro:run", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid Maestro run payload");
		}
		const input = payload as { cwd?: unknown; args?: unknown };
		const cwd = validateCwd(input.cwd);
		const args = validateArgs(input.args);
		return runExecutable("maestro", args, cwd);
	});

	ipcMain.handle("maestro:readState", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid state payload");
		}
		const cwd = validateCwd((payload as { cwd?: unknown }).cwd);
		return readFirstWorkflowState(cwd);
	});

	ipcMain.handle(
		"maestro:createCodingSession",
		async (_event, payload: unknown) => {
			if (payload === null || typeof payload !== "object") {
				throw new Error("Invalid coding session payload");
			}
			const input = payload as { cwd?: unknown; task?: unknown };
			const cwd = validateCwd(input.cwd);
			const task = validateTask(input.task);
			try {
				return await createCodingSession(cwd, task);
			} catch (error) {
				return {
					ok: false,
					sessionId: "",
					sessionDir: "",
					statusPath: "",
					error: error instanceof Error ? error.message : String(error),
				};
			}
		},
	);

	ipcMain.handle("maestro:ralphSession", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid Ralph session payload");
		}
		const input = payload as { cwd?: unknown; sessionId?: unknown };
		const cwd = validateCwd(input.cwd);
		const sessionId = validateSessionId(input.sessionId);
		return runRalphCommand(
			cwd,
			sessionId ? ["session", "--session", sessionId] : ["session"],
		);
	});

	ipcMain.handle("maestro:ralphCheck", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid Ralph check payload");
		}
		const input = payload as { cwd?: unknown; sessionId?: unknown };
		const cwd = validateCwd(input.cwd);
		const sessionId = validateSessionId(input.sessionId);
		return runRalphCommand(
			cwd,
			sessionId ? ["check", "--session", sessionId] : ["check"],
		);
	});

	ipcMain.handle("maestro:ralphNext", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid Ralph next payload");
		}
		const input = payload as { cwd?: unknown; sessionId?: unknown };
		const cwd = validateCwd(input.cwd);
		const sessionId = validateSessionId(input.sessionId);
		return runRalphCommand(
			cwd,
			sessionId ? ["next", "--session", sessionId] : ["next"],
		);
	});

	ipcMain.handle("maestro:ralphRetry", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid Ralph retry payload");
		}
		const input = payload as {
			cwd?: unknown;
			sessionId?: unknown;
			index?: unknown;
		};
		const cwd = validateCwd(input.cwd);
		const sessionId = validateSessionId(input.sessionId);
		const index = validateStepIndex(input.index);
		return runRalphCommand(
			cwd,
			sessionId
				? ["retry", String(index), "--session", sessionId]
				: ["retry", String(index)],
		);
	});

	ipcMain.handle("maestro:ralphComplete", async (_event, payload: unknown) => {
		if (payload === null || typeof payload !== "object") {
			throw new Error("Invalid Ralph complete payload");
		}
		const input = payload as {
			cwd?: unknown;
			sessionId?: unknown;
			index?: unknown;
			status?: unknown;
			evidence?: unknown;
			concerns?: unknown;
			reason?: unknown;
		};
		const cwd = validateCwd(input.cwd);
		const sessionId = validateSessionId(input.sessionId);
		const index = validateStepIndex(input.index);
		const status = validateCompletionStatus(input.status);
		const evidence = validateOptionalText(input.evidence, "Evidence");
		const concerns = validateOptionalText(input.concerns, "Concerns");
		const reason = validateOptionalText(input.reason, "Reason");
		const args = ["complete", String(index), "--status", status];
		if (evidence) args.push("--evidence", evidence);
		if (concerns) args.push("--concerns", concerns);
		if (reason) args.push("--reason", reason);
		if (sessionId) args.push("--session", sessionId);
		return runRalphCommand(cwd, args);
	});
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1280,
		height: 820,
		minWidth: 980,
		minHeight: 640,
		title: "Oh My Maestro",
		backgroundColor: "#101214",
		webPreferences: {
			preload: join(__dirname, "../preload/index.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	if (IS_DEV) {
		win.loadURL("http://localhost:5173");
		win.webContents.openDevTools();
	} else {
		win.loadFile(join(__dirname, "../renderer/index.html"));
	}
}

app.whenReady().then(() => {
	registerMaestroIpc();
	createWindow();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

export function setSkipQuitConfirmation(): void {}

export function exitImmediately(): void {
	app.exit(0);
}
