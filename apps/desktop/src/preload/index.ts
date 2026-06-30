import { contextBridge, ipcRenderer } from "electron";

declare const __APP_VERSION__: string;

interface MaestroRunPayload {
	cwd: string;
	args: string[];
}

interface MaestroRunResult {
	ok: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	error?: string;
}

interface MaestroCliStatus {
	available: boolean;
	path: string;
	error?: string;
}

interface MaestroStateResult {
	ok: boolean;
	raw: string;
	path?: string;
	checkedPaths: string[];
	error?: string;
}

interface MaestroCodingSessionPayload {
	cwd: string;
	task: string;
}

interface MaestroCodingSessionResult {
	ok: boolean;
	sessionId: string;
	sessionDir: string;
	statusPath: string;
	error?: string;
}

interface RalphCommandPayload {
	cwd: string;
	sessionId?: string;
}

interface RalphCompletePayload extends RalphCommandPayload {
	index: number;
	status: "DONE" | "DONE_WITH_CONCERNS" | "NEEDS_RETRY" | "BLOCKED";
	evidence?: string;
	concerns?: string;
	reason?: string;
}

interface RalphRetryPayload extends RalphCommandPayload {
	index: number;
}

declare global {
	interface Window {
		App: typeof API;
		maestro: typeof maestroAPI;
	}
}

const API = {
	sayHelloFromBridge: () => console.log("\nHello from Maestro bridge! 👋\n\n"),
	username: process.env.USER || process.env.USERNAME,
	appVersion: __APP_VERSION__,
};

const maestroAPI = {
	selectProject: () => ipcRenderer.invoke("maestro:selectProject") as Promise<string | null>,
	checkCli: () => ipcRenderer.invoke("maestro:checkCli") as Promise<MaestroCliStatus>,
	run: (payload: MaestroRunPayload) =>
		ipcRenderer.invoke("maestro:run", payload) as Promise<MaestroRunResult>,
	readState: (cwd: string) =>
		ipcRenderer.invoke("maestro:readState", { cwd }) as Promise<MaestroStateResult>,
	createCodingSession: (payload: MaestroCodingSessionPayload) =>
		ipcRenderer.invoke(
			"maestro:createCodingSession",
			payload,
		) as Promise<MaestroCodingSessionResult>,
	ralphSession: (payload: RalphCommandPayload) =>
		ipcRenderer.invoke("maestro:ralphSession", payload) as Promise<MaestroRunResult>,
	ralphCheck: (payload: RalphCommandPayload) =>
		ipcRenderer.invoke("maestro:ralphCheck", payload) as Promise<MaestroRunResult>,
	ralphNext: (payload: RalphCommandPayload) =>
		ipcRenderer.invoke("maestro:ralphNext", payload) as Promise<MaestroRunResult>,
	ralphComplete: (payload: RalphCompletePayload) =>
		ipcRenderer.invoke("maestro:ralphComplete", payload) as Promise<MaestroRunResult>,
	ralphRetry: (payload: RalphRetryPayload) =>
		ipcRenderer.invoke("maestro:ralphRetry", payload) as Promise<MaestroRunResult>,
};

contextBridge.exposeInMainWorld("App", API);
contextBridge.exposeInMainWorld("maestro", maestroAPI);
