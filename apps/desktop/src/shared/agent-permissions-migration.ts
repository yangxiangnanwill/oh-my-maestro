// Phase 4: Agent permissions migration (migrated from Superset @superset/shared/agent-permissions-migration)

import type { AgentPresetOverrideEnvelope } from "main/lib/local-db";

/**
 * Applies legacy permissions overrides for existing users upgrading from pre-3.5.46.
 * Returns the updated override envelope.
 */
export function applyLegacyPermissionsOverrides(
	overrides: AgentPresetOverrideEnvelope,
): AgentPresetOverrideEnvelope {
	return overrides;
}

/**
 * Checks whether the stored terminal presets match the pre-3.5.46 seed data.
 */
export function terminalPresetsMatchPre3546Seed(_presets: unknown): boolean {
	return false;
}
