/**
 * Shared TipTap type utilities.
 *
 * 解决 @tiptap/react useEditor 的 extensions 数组类型推断问题。
 * 在 MarkdownEditor 和 TipTapMarkdownRenderer 两处使用，
 * 避免重复复杂的条件类型断言。
 */

import type { useEditor } from "@tiptap/react";

/** TipTap useEditor extensions 数组的正确类型 */
export type TipTapExtensions = Parameters<typeof useEditor>[0] extends {
	extensions?: infer E;
}
	? E
	: never;
