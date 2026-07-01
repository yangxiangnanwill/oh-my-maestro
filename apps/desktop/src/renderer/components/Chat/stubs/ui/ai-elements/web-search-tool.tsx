export type ToolState =
	| "pending"
	| "in-progress"
	| "complete"
	| "error"
	| "input-streaming"
	| "input-available"
	| "output-available"
	| "output-error";

export interface WebSearchResult {
	title: string;
	url: string;
	snippet?: string;
	[key: string]: unknown;
}

export type WebSearchResultItem = WebSearchResult;

export interface WebSearchToolProps {
	query: string;
	results: WebSearchResult[];
	state?: ToolState;
}

export function WebSearchTool({ query, results, state }: WebSearchToolProps) {
	return null;
}
