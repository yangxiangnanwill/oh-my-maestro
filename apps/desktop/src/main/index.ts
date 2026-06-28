import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
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

async function readFirstWorkflowState(cwd: string): Promise<MaestroStateResult> {
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
						typeof (error as NodeJS.ErrnoException & { code?: unknown }).code ===
						"number"
							? ((error as NodeJS.ErrnoException & { code: number }).code)
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
