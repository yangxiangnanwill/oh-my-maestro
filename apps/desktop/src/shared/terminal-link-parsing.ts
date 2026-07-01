/*---------------------------------------------------------------------------------------------
 *  Adapted from VSCode's terminalLinkParsing.ts
 *  https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing.ts
 *
 *  Parsing helpers for terminal link detection. Stripped down to the functions
 *  needed by LocalLinkDetector and TerminalLinkResolver.
 *--------------------------------------------------------------------------------------------*/

export type OSType = "windows" | "linux" | "mac";

export interface IParsedLinkPath {
	index: number;
	text: string;
}

export interface IParsedLinkSuffix {
	col: number | undefined;
	colEnd: number | undefined;
	row: number | undefined;
	rowEnd: number | undefined;
	suffix: { index: number; text: string };
}

export interface IParsedLink {
	path: IParsedLinkPath;
	prefix?: { index: number; text: string };
	suffix?: IParsedLinkSuffix;
}

export interface FallbackLink {
	link: string;
	path: string;
	index: number;
	line?: number;
	col?: number;
}

// ---------------------------------------------------------------------------
// Suffix patterns — must match what detectLinks() uses to split path from
// line/col annotations.  Line numbers appear after : ( :line or :line:col ),
// inside parens ( (line) or (line,col) ), or inside brackets ( [line] or
// [line,col] ).  We keep this regex tight so it only fires when the path
// portion is a recognizable filename.
// ---------------------------------------------------------------------------

/**
 * Pattern that matches a line/column suffix after a path.
 * Examples: :42, :42:10, (42), (42,10), [42], [42,10], #42
 */
const _LINE_COL_SUFFIX_PATTERN =
	/^[:([](\d+)(?:[,:]\s*(\d+))?\s*[)\]]|^\[(\d+)(?:[,:]\s*(\d+))?\]|^#(\d+)/;

// Query string pattern
const QUERY_STRING = /[?#].*$/;

/**
 * Strip line/column suffix (e.g. ":42", ":42:10", "(42)", "(42,10)")
 */
export function removeLinkSuffix(link: string): string {
	// Try each suffix pattern anchored at the position after the last path-like segment
	const parts = link.match(
		/^(.+?)(:\d+(:\d+)?|\(\d+(,\d+)?\)|\[\d+(,\d+)?\]|#\d+)$/,
	);
	if (parts?.[1]) {
		return parts[1].trim();
	}
	return link.trim();
}

/**
 * Remove query string and hash from a link.
 */
export function removeLinkQueryString(link: string): string {
	return link.replace(QUERY_STRING, "");
}

/**
 * Get the current OS type (browser-safe).
 */
export function getCurrentOS(): OSType {
	if (typeof navigator !== "undefined") {
		const platform = navigator.platform?.toLowerCase() ?? "";
		if (platform.includes("win")) return "windows";
		if (platform.includes("mac")) return "mac";
	}
	return "linux";
}

// ---------------------------------------------------------------------------
// Path detection
// ---------------------------------------------------------------------------

// Matches absolute paths, relative paths, and tilde paths.
// Stops at whitespace, quotes, or common shell delimiters.
const PATH_REGEX =
	/(?:(?:\]8;;)|(?:file:\/\/\/?))?(?<path>(?:[./]|~\/)[^\s"'`;|><{}[\]]+)/g;

// Matches the section of a path from the last / onwards to check for suffix
const _PATH_END_REGEX = /([^/\s]+)$/;

/**
 * Detect link candidates from terminal text.
 *
 * The regex matches candidate paths that may include a line/column suffix
 * (e.g. "/foo/bar.ts:42:10" or "./file.ts(5,3)"). This function splits the
 * raw match into a clean path and a parsed suffix.
 */
export function detectLinks(text: string, _os: OSType): IParsedLink[] {
	const results: IParsedLink[] = [];
	const regex = new RegExp(PATH_REGEX.source, "g");
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
	while ((match = regex.exec(text)) !== null) {
		const rawText = match.groups?.path ?? match[0];
		if (!rawText) continue;
		const rawIndex = match.index + match[0].indexOf(rawText);

		const parsed = splitPathAndSuffix(rawText, rawIndex);
		if (!parsed) continue;

		results.push(parsed);
	}

	return results;
}

/**
 * Split a raw path candidate into path + suffix components.
 * e.g. "./file.ts:42:10" -> path="./file.ts", row=42, col=10
 * e.g. "/foo/bar.ts" -> path="/foo/bar.ts", no suffix
 */
function splitPathAndSuffix(
	rawText: string,
	rawIndex: number,
): IParsedLink | null {
	if (!rawText) return null;

	// Try to match suffix at the end of the text.
	// We scan from the end backwards looking for a known suffix format.
	const suffixResult = extractSuffix(rawText);
	if (suffixResult) {
		return {
			path: {
				index: rawIndex,
				text: suffixResult.path,
			},
			suffix: suffixResult.suffix,
		};
	}

	// No suffix found — the whole text is the path
	return {
		path: { index: rawIndex, text: rawText },
	};
}

interface SuffixResult {
	path: string;
	suffix: IParsedLinkSuffix;
}

function extractSuffix(rawText: string): SuffixResult | null {
	// Try each suffix format, longest match first
	const patterns: Array<{
		regex: RegExp;
		extract: (m: RegExpMatchArray) => { row: number; col?: number };
	}> = [
		// :42:10 or :42
		{
			regex: /^(.+?):(\d+)(?::(\d+))?$/,
			extract: (m) => ({
				row: Number.parseInt(m[2], 10),
				col: m[3] ? Number.parseInt(m[3], 10) : undefined,
			}),
		},
		// (42,10) or (42, 10) or (42)
		{
			regex: /^(.+?)\s*\((\d+)(?:,\s*(\d+))?\)$/,
			extract: (m) => ({
				row: Number.parseInt(m[2], 10),
				col: m[3] ? Number.parseInt(m[3], 10) : undefined,
			}),
		},
		// [42,10] or [42, 10] or [42]
		{
			regex: /^(.+?)\[(\d+)(?:,\s*(\d+))?\]$/,
			extract: (m) => ({
				row: Number.parseInt(m[2], 10),
				col: m[3] ? Number.parseInt(m[3], 10) : undefined,
			}),
		},
		// #42
		{
			regex: /^(.+?)#(\d+)$/,
			extract: (m) => ({
				row: Number.parseInt(m[2], 10),
			}),
		},
		// "path" on line 42
		{
			regex: /^(.+?)"\s+on\s+line\s+(\d+)(?:,\s*column\s+(\d+))?$/,
			extract: (m) => ({
				row: Number.parseInt(m[2], 10),
				col: m[3] ? Number.parseInt(m[3], 10) : undefined,
			}),
		},
	];

	for (const { regex, extract } of patterns) {
		const m = rawText.match(regex);
		if (m?.[1]) {
			const path = m[1].replace(/"$/, ""); // strip trailing quote if present
			const { row, col } = extract(m);

			// Compute suffix text and position
			const suffixStart = path.length;
			const suffixText = rawText.substring(suffixStart);

			return {
				path,
				suffix: {
					col,
					colEnd: undefined,
					row,
					rowEnd: undefined,
					suffix: {
						index: suffixStart,
						text: suffixText,
					},
				},
			};
		}
	}

	return null;
}

/**
 * Generate trimmed path candidates by removing trailing punctuation
 * (brackets, quotes, commas, periods, etc.).
 */
export function generateTrimmedCandidates(path: string): { path: string }[] {
	const candidates: { path: string }[] = [];
	if (!path) return candidates;

	// Trim trailing punctuation that commonly gets included in path matches
	const trimmed = path.replace(/[.,;:!?)\]}"'`>]+$/, "");
	if (trimmed !== path && trimmed.length > 1) {
		candidates.push({ path: trimmed });
	}

	return candidates;
}

// ---------------------------------------------------------------------------
// Fallback matchers (language-specific error formats from VSCode)
// ---------------------------------------------------------------------------

interface FallbackMatcher {
	pattern: RegExp;
	pathIndex: number;
	lineIndex?: number;
	colIndex?: number;
}

const FALLBACK_MATCHERS: FallbackMatcher[] = [
	// Python: File "/path/to/file.py", line 42
	{
		pattern: /\s+File "([^"]+)", line (\d+)/g,
		pathIndex: 1,
		lineIndex: 2,
	},
	// Rust: --> src/main.rs:10:5
	{
		pattern: /\s+-->\s+(\S+):(\d+):(\d+)/g,
		pathIndex: 1,
		lineIndex: 2,
		colIndex: 3,
	},
	// C++: /path/to/file.cpp(339): error C2065
	{
		pattern: /([^\s]+)\((\d+)\):\s*(?:error|warning)/g,
		pathIndex: 1,
		lineIndex: 2,
	},
	// Node.js: at Object.<anonymous> (/path/to/file.js:10:5)
	{
		pattern: /\s+at\s+[^(]*\(([^)]+)\)/g,
		pathIndex: 1,
	},
	// Git diff: --- a/path or +++ b/path
	{
		pattern: /^(?:---|\+\+\+) [ab]\/(.+)/gm,
		pathIndex: 1,
	},
	// Git diff --git: diff --git a/path b/path (captures both paths separately)
	{
		pattern: /^diff --git a\/(\S+) b\/(\S+)/gm,
		pathIndex: 1,
	},
];

/**
 * Detect links using language-specific fallback matchers.
 * Called when primary detection produces no results.
 */
export function detectFallbackLinks(text: string): FallbackLink[] {
	const results: FallbackLink[] = [];
	const seen = new Set<string>();

	for (const matcher of FALLBACK_MATCHERS) {
		const regex = new RegExp(matcher.pattern.source, matcher.pattern.flags);
		let match: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop pattern
		while ((match = regex.exec(text)) !== null) {
			// For git diff --git, handle both a/ and b/ paths
			if (matcher.pattern.source.includes("diff --git") && match[2]) {
				// First path (a/)
				const pathA = match[1];
				if (pathA && !seen.has(pathA)) {
					const linkText = `a/${pathA}`;
					const linkIndex = match.index + match[0].indexOf(linkText);
					seen.add(pathA);
					results.push({
						link: linkText,
						path: pathA,
						index: linkIndex,
					});
				}
				// Second path (b/)
				const pathB = match[2];
				if (pathB && !seen.has(pathB)) {
					const linkTextB = `b/${pathB}`;
					const linkIndexB = match.index + match[0].indexOf(linkTextB);
					seen.add(pathB);
					results.push({
						link: linkTextB,
						path: pathB,
						index: linkIndexB,
					});
				}
				continue;
			}

			const path = match[matcher.pathIndex];
			if (!path) continue;

			// For Node.js "at (path:line:col)", extract just the path:line:col part
			let extractedPath = path;
			let extractedLine: number | undefined;
			let extractedCol: number | undefined;

			// Handle "path:line:col" format inside the parens
			const lineColMatch = path.match(/(.+?):(\d+)(?::(\d+))?$/);
			if (lineColMatch) {
				extractedPath = lineColMatch[1];
				extractedLine = Number.parseInt(lineColMatch[2], 10);
				if (lineColMatch[3]) {
					extractedCol = Number.parseInt(lineColMatch[3], 10);
				}
			}

			if (seen.has(extractedPath)) continue;
			seen.add(extractedPath);

			const line =
				matcher.lineIndex !== undefined
					? Number.parseInt(match[matcher.lineIndex], 10)
					: extractedLine;
			const col =
				matcher.colIndex !== undefined
					? Number.parseInt(match[matcher.colIndex], 10)
					: extractedCol;

			const linkText = match[0].trimStart();
			const linkIndex = match.index + (match[0].length - linkText.length);

			results.push({
				link: linkText,
				path: extractedPath,
				index: linkIndex,
				line,
				col,
			});
		}
	}

	return results;
}
