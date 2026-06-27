/**
 * Phase 4: Workspace run definition (stub migrated from Superset).
 * Resolves the set of commands to run when a workspace is opened.
 */

interface WorkspaceRunDefinition {
	commands: string[];
}

export function selectWorkspaceRunDefinition({
	presets,
	configRunCommands,
	configCwd: _configCwd,
}: {
	presets: Array<{ commands?: string[] }>;
	configRunCommands?: string[];
	configCwd?: string;
	projectId: string;
}): WorkspaceRunDefinition | null {
	const commands: string[] = [];

	// Add config run commands first
	if (configRunCommands && configRunCommands.length > 0) {
		commands.push(...configRunCommands);
	}

	// Add preset run commands
	for (const preset of presets) {
		if (preset.commands && preset.commands.length > 0) {
			commands.push(...preset.commands);
		}
	}

	if (commands.length === 0) return null;

	return { commands };
}
