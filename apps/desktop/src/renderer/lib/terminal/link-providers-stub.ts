/**
 * Stub for link-providers module (not yet migrated from Superset).
 * Used by terminal-link-manager.ts for URL link detection in terminals.
 */

import type { ILinkProvider, Terminal, IViewportRange, ILink } from "@xterm/xterm";

export class UrlLinkProvider implements ILinkProvider {
  provideLinks(
    _line: number,
    _callback: (links: ILink[] | undefined) => void,
  ): void {
    // Stub: no-op
  }
}
