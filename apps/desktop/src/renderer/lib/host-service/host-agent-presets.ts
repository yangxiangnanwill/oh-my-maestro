/**
 * Built-in host agent presets.
 *
 * Mirrors the data from @superset/shared/host-agent-presets.
 * Each preset defines a known agent executable and its preset icon key.
 * Used by preset-icon-key.ts to resolve icons from command executables.
 */
export interface HostAgentPreset {
	presetId: string;
	command: string;
}

export const HOST_AGENT_PRESETS: HostAgentPreset[] = [
	{ presetId: "claude", command: "claude" },
	{ presetId: "codex", command: "codex" },
	{ presetId: "gemini", command: "gemini" },
	{ presetId: "opencode", command: "opencode" },
	{ presetId: "cursor-agent", command: "cursor-agent" },
	{ presetId: "copilot-agent", command: "copilot-agent" },
	{ presetId: "qwen", command: "qwen" },
	{ presetId: "windsurf", command: "windsurf" },
	{ presetId: "aider", command: "aider" },
	{ presetId: "cline", command: "cline" },
	{ presetId: "roo-code", command: "roo-code" },
	{ presetId: "auggie", command: "auggie" },
	{ presetId: "augment", command: "augment" },
	{ presetId: "continue", command: "continue" },
	{ presetId: "kilo-code", command: "kilo-code" },
	{ presetId: "amazon-q", command: "amazon-q" },
	{ presetId: "github-copilot", command: "github-copilot" },
	{ presetId: "windsurf", command: "windsurf" },
	{ presetId: "trae", command: "trae" },
	{ presetId: "cody", command: "cody" },
	{ presetId: "codebuddy", command: "codebuddy" },
	{ presetId: "deepseek", command: "deepseek" },
	{ presetId: "tabnine", command: "tabnine" },
	{ presetId: "sourcegraph", command: "sourcegraph" },
	{ presetId: "replit", command: "replit" },
	{ presetId: "lovable", command: "lovable" },
	{ presetId: "bolt", command: "bolt" },
	{ presetId: "v0", command: "v0" },
	{ presetId: "cursor", command: "cursor" },
	{ presetId: "windsurf", command: "windsurf" },
];
