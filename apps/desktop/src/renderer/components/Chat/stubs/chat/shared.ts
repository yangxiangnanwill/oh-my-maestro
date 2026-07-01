// Stub: @superset/chat/shared
// Shared chat utilities.
// Full implementation pending chat package migration.

// ParsedNamedSlashArgument type used by slash command preview model
export interface ParsedNamedSlashArgument {
	keyRaw: string;
	keyUpper: string;
	value: string;
}

// Tokenize a slash command argument string into individual tokens
export function tokenizeSlashCommandArguments(argsRaw: string): string[] {
	if (!argsRaw.trim()) return [];
	const tokens: string[] = [];
	let current = "";
	let inQuote = false;
	let quoteChar = "";

	for (const ch of argsRaw) {
		if (inQuote) {
			if (ch === quoteChar) {
				inQuote = false;
				quoteChar = "";
			} else {
				current += ch;
			}
		} else if (ch === '"' || ch === "'") {
			inQuote = true;
			quoteChar = ch;
		} else if (ch === " " || ch === "\t") {
			if (current) {
				tokens.push(current);
				current = "";
			}
		} else {
			current += ch;
		}
	}
	if (current) tokens.push(current);
	return tokens;
}

// Parse a named argument token like "key=value" or "--key=value"
export function parseNamedSlashArgumentToken(
	token: string,
): ParsedNamedSlashArgument | null {
	const eqIdx = token.indexOf("=");
	if (eqIdx === -1) return null;

	const keyRaw = token.slice(0, eqIdx);
	const value = token.slice(eqIdx + 1);

	// Strip leading dashes for normalization
	const cleanKey = keyRaw.replace(/^-+/, "");
	if (!cleanKey) return null;

	return {
		keyRaw,
		keyUpper: cleanKey.toUpperCase(),
		value,
	};
}

// Normalize a named argument key to uppercase
export function normalizeSlashNamedArgumentKey(key: string): string {
	return key.toUpperCase();
}

// Find a slash command by name or alias
export function findSlashCommandByNameOrAlias<
	T extends { name: string; aliases: string[] },
>(commands: T[], query: string): T | null {
	const lowerQuery = query.toLowerCase();
	return (
		commands.find((c) => c.name.toLowerCase() === lowerQuery) ??
		commands.find((c) =>
			c.aliases.some((a) => a.toLowerCase() === lowerQuery),
		) ??
		null
	);
}
