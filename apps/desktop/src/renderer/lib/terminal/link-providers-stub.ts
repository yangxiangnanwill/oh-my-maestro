/**
 * Stub for link-providers module (not yet migrated from Superset).
 * Used by terminal-link-manager.ts for URL link detection in terminals.
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
