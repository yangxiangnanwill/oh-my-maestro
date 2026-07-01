import fs from "node:fs";
import {
	setupDesktopAgentCapabilities,
	setupSingleAgent,
} from "./desktop-agent-setup";
import {
	BASH_DIR,
	BIN_DIR,
	HOOKS_DIR,
	OPENCODE_PLUGIN_DIR,
	ZSH_DIR,
} from "./paths";
import { createRalphDecisionBridge } from "./ralph-decision-bridge";
import {
	createBashWrapper,
	createZshWrapper,
	getCommandShellArgs,
	getShellArgs,
	getShellEnv,
} from "./shell-wrappers";

export function setupAgentHooks(): void {
	console.log("[agent-setup] Initializing agent hooks...");

	fs.mkdirSync(BIN_DIR, { recursive: true });
	fs.mkdirSync(HOOKS_DIR, { recursive: true });
	fs.mkdirSync(ZSH_DIR, { recursive: true });
	fs.mkdirSync(BASH_DIR, { recursive: true });
	fs.mkdirSync(OPENCODE_PLUGIN_DIR, { recursive: true });

	setupDesktopAgentCapabilities();

	createZshWrapper();
	createBashWrapper();

	// Register Ralph decision bridge — bridges Maestro-flow Ralph decision
	// engine events (decision-node-created, decision-node-resolved,
	// decision-node-expired) into Superset Agent lifecycle hooks.
	try {
		createRalphDecisionBridge();
		console.log("[agent-setup] Ralph decision bridge registered");
	} catch (error) {
		console.error(
			"[agent-setup] Failed to register Ralph decision bridge:",
			error,
		);
	}

	console.log("[agent-setup] Agent hooks initialized");
}

export function getSupersetBinDir(): string {
	return BIN_DIR;
}

export { setupSingleAgent };

export { getCommandShellArgs, getShellArgs, getShellEnv };
