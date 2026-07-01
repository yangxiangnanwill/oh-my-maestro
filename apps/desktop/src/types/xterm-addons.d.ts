/**
 * Type declarations for @xterm addons not yet installed as packages.
 * These provide minimal type stubs so the codebase compiles while
 * the actual addon packages are being evaluated for inclusion.
 */

declare module "@xterm/addon-clipboard" {
	import type { Terminal } from "@xterm/xterm";

	export interface IBase64 {
		encodeText(data: string): string;
		decodeText(data: string): string;
	}

	export class ClipboardAddon {
		constructor(codec?: IBase64);
		activate(terminal: Terminal): void;
		dispose(): void;
	}
}

declare module "@xterm/addon-image" {
	import type { Terminal } from "@xterm/xterm";

	export interface IImageAddonOptions {
		enableSizeReports?: boolean;
		pixelLimit?: number;
		storageLimit?: number;
		sixelSupport?: boolean;
		sixelScrolling?: boolean;
		sixelPaletteLimit?: number;
		iTermSupport?: boolean;
	}

	export class ImageAddon {
		constructor(options?: IImageAddonOptions);
		activate(terminal: Terminal): void;
		dispose(): void;
	}
}

declare module "@xterm/addon-ligatures" {
	import type { Terminal } from "@xterm/xterm";

	export class LigaturesAddon {
		constructor();
		activate(terminal: Terminal): void;
		dispose(): void;
	}
}

declare module "@xterm/addon-progress" {
	import type { Terminal } from "@xterm/xterm";

	export interface IProgressAddonOptions {
		progressBarLength?: number;
		emptyCellChar?: string;
		cellChar?: string;
		verticalPadding?: number;
	}

	export class ProgressAddon {
		constructor(options?: IProgressAddonOptions);
		activate(terminal: Terminal): void;
		dispose(): void;
		progress: number;
	}
}

declare module "@xterm/addon-search" {
	import type { Terminal } from "@xterm/xterm";

	export interface ISearchOptions {
		regex?: boolean;
		wholeWord?: boolean;
		caseSensitive?: boolean;
		incremental?: boolean;
		decorations?: {
			matchBackground?: string;
			matchBorder?: string;
			activeMatchBackground?: string;
			activeMatchBorder?: string;
			matchOverviewRuler?: string;
			activeMatchOverviewRuler?: string;
		};
	}

	export class SearchAddon {
		constructor();
		activate(terminal: Terminal): void;
		dispose(): void;
		findNext(query: string, options?: ISearchOptions): boolean;
		findPrevious(query: string, options?: ISearchOptions): boolean;
		clearDecorations(): void;
	}
}

declare module "@xterm/addon-unicode11" {
	import type { Terminal } from "@xterm/xterm";

	export class Unicode11Addon {
		constructor();
		activate(terminal: Terminal): void;
		dispose(): void;
	}
}

declare module "@xterm/addon-webgl" {
	import type { Terminal } from "@xterm/xterm";

	export interface IWebglAddonOptions {
		antialias?: boolean;
	}

	export class WebglAddon {
		constructor(options?: IWebglAddonOptions);
		activate(terminal: Terminal): void;
		dispose(): void;
		onContextLoss(callback: () => void): void;
	}
}
