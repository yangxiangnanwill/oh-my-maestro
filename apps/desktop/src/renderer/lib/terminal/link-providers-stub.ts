/**
 * Stub for link-providers module (not yet migrated from Superset).
 * Used by terminal-link-manager.ts for URL link detection in terminals.
 *
 * Phase 4: 迁移真实的 VSCode UrlLinkProvider 实现。
 * 当前 provideLinks 为空操作 — 终端 URL 链接检测功能完全失效。
 * 注册时 terminal-link-manager.ts 会输出 console.warn 提示功能不可用。
 */

import type { ILinkHandler, ILinkProvider, Terminal, IViewportRange, ILink } from "@xterm/xterm";

export class UrlLinkProvider implements ILinkProvider {
  constructor(
    _terminal: Terminal,
    _onActivate?: (event: globalThis.MouseEvent, uri: string) => void,
    _onHover?: (event: globalThis.MouseEvent) => void,
    _onLeave?: () => void,
  ) {
    // Stub: constructor accepts arguments for compatibility with the real VSCode provider
  }

  provideLinks(
    _line: number,
    _callback: (links: ILink[] | undefined) => void,
  ): void {
    // Stub: no-op
  }
}
