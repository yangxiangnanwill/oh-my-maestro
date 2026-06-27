/**
 * Type declaration for tiptap-markdown.
 * Minimal stub for the Markdown extension used by the Markdown editor and renderer.
 */

declare module "tiptap-markdown" {
  import type { Extensions } from "@tiptap/core";

  export interface MarkdownOptions {
    html?: boolean;
    tightLists?: boolean;
    tightListClass?: string;
    bulletListMarker?: string;
    linkify?: boolean;
    breaks?: boolean;
    transformPastedText?: boolean;
    transformCopiedText?: boolean;
  }

  export class Markdown {
    constructor(options?: MarkdownOptions);
    static configure(options: MarkdownExtensionOptions): Extensions;
  }

  export interface MarkdownExtensionOptions {
    markdownOptions?: MarkdownOptions;
  }

  export const MarkdownExtension: {
    configure(options: MarkdownExtensionOptions): Extensions;
  };
}
