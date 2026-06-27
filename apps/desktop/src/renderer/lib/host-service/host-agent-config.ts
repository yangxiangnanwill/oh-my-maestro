/**
 * HostAgentConfig type definition.
 *
 * Mirrors the type from @superset/host-service/settings. Used by
 * preset-icon resolution to map agent config IDs to preset icon keys.
 */
export interface HostAgentConfig {
	id: string;
	presetId: string;
	label: string;
	command: string;
	args: string[];
	promptTransport: string;
	promptArgs: string[];
	env: Record<string, string>;
	order: number;
}
