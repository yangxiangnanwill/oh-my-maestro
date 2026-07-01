import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PORTS_FILE_NAME, PROJECT_SUPERSET_DIR_NAME } from "shared/constants";

interface StaticPort {
	port: number;
	label: string;
}

interface StaticPortsResult {
	exists: boolean;
	ports: StaticPort[] | null;
	error: string | null;
}

/**
 * Load and validate static ports configuration from a worktree's .superset/ports.json file.
 */
export function loadStaticPorts(worktreePath: string): StaticPortsResult {
	const portsPath = join(
		worktreePath,
		PROJECT_SUPERSET_DIR_NAME,
		PORTS_FILE_NAME,
	);

	if (!existsSync(portsPath)) {
		return { exists: false, ports: null, error: null };
	}

	let content: string;
	try {
		content = readFileSync(portsPath, "utf-8");
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			exists: true,
			ports: null,
			error: `Failed to read ports.json: ${message}`,
		};
	}

	try {
		const parsed = JSON.parse(content);
		if (!Array.isArray(parsed)) {
			return {
				exists: true,
				ports: null,
				error: "ports.json must be an array",
			};
		}
		const ports: StaticPort[] = [];
		for (const entry of parsed) {
			if (
				entry &&
				typeof entry === "object" &&
				typeof entry.port === "number" &&
				typeof entry.label === "string"
			) {
				ports.push({ port: entry.port, label: entry.label });
			}
		}
		return { exists: true, ports, error: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { exists: true, ports: null, error: `Invalid JSON: ${message}` };
	}
}
