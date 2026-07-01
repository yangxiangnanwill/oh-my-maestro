// Phase 3 stub — replace with @maestro/port-scanner in Phase 4
import { EventEmitter } from "node:events";
import type { DetectedPort } from "shared/types";
import { treeKillWithEscalation } from "../tree-kill";

export interface KillPortInput {
	workspaceId: string;
	terminalId: string;
	port: number;
}

class PortManager extends EventEmitter {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private killFn: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(opts: { killFn: any }) {
		super();
		this.killFn = opts.killFn;
	}
	upsertSession(..._args: unknown[]): void {}
	unregisterSession(..._args: unknown[]): void {}
	checkOutputForHint(..._args: unknown[]): void {}

	getAllPorts(): DetectedPort[] {
		// Phase 4 stub
		return [];
	}

	async killPort(
		_input: KillPortInput,
	): Promise<{ success: boolean; error?: string }> {
		// Phase 4 stub
		return { success: true };
	}
}

export const portManager = new PortManager({
	killFn: treeKillWithEscalation,
});
