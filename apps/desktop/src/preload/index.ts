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
};

contextBridge.exposeInMainWorld("App", API);
contextBridge.exposeInMainWorld("maestro", maestroAPI);
