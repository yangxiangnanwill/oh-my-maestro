// LinkAction: what happens when a link row is clicked under a given modifier tier.
// "pane"  = open in the current pane
// "newTab" = open in a new pane tab
// "external" = open in the user's external editor (files) or default browser (URLs)
export type LinkAction = "pane" | "newTab" | "external";

// LinkTier: modifier key tier — 4 independent states that map to LinkActions.
export type LinkTier = "plain" | "shift" | "meta" | "metaShift";

// LinkTierMap: settings-driven mapping from each tier to its chosen action.
// null = unbound (do nothing).
export type LinkTierMap = Record<LinkTier, LinkAction | null>;

export interface ModifierEvent {
	metaKey: boolean;
	ctrlKey: boolean;
	shiftKey: boolean;
}

/**
 * 4-tier surfaces (terminal, sidebar) read every tier independently.
 * 2-tier surfaces (chat, task markdown) collapse `shift→plain` and
 * `metaShift→meta` because the embedding context (rich text) needs
 * to keep shift-click free for cursor selection.
 */
export type TierMode = "4-tier" | "2-tier";

/**
 * Surface determines which action labels are surfaced in tooltips and
 * settings (e.g. "external" reads "Open in editor" for files but
 * "Open in browser" for URLs).
 */
export type Surface = "file" | "url";

export interface ResolvedClick {
	tier: LinkTier;
	action: LinkAction | null;
}
