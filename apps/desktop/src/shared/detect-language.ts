// ============================================================
// Phase 4: Language detection (migrated from Superset shared/detect-language)
// ============================================================

const EXTENSION_MAP: Record<string, string> = {
	ts: "typescript",
	tsx: "typescript",
	js: "javascript",
	jsx: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	html: "html",
	htm: "html",
	astro: "html",
	css: "css",
	scss: "scss",
	sass: "scss",
	less: "less",
	json: "json",
	jsonc: "json",
	yaml: "yaml",
	yml: "yaml",
	xml: "xml",
	svg: "xml",
	md: "markdown",
	mdx: "markdown",
	sh: "shell",
	bash: "shell",
	zsh: "shell",
	py: "python",
	go: "go",
	rs: "rust",
	java: "java",
	kt: "kotlin",
	swift: "swift",
	c: "c",
	cpp: "cpp",
	h: "c",
	hpp: "cpp",
	rb: "ruby",
	php: "php",
	sql: "sql",
	graphql: "graphql",
	gql: "graphql",
	toml: "toml",
	ini: "ini",
	cfg: "ini",
	dockerfile: "dockerfile",
	env: "env",
};

export function detectLanguage(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
	return EXTENSION_MAP[ext] ?? "plaintext";
}
