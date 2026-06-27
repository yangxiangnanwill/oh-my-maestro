import { useCallback, useMemo } from "react";
import { buildHint } from "../hint";
import { tierFor } from "../tiers";
import type {
	LinkAction,
	LinkTierMap,
	ModifierEvent,
	ResolvedClick,
	Surface,
	TierMode,
} from "../types";

export interface ClickPolicy {
	resolve: (event: ModifierEvent) => ResolvedClick;
	getAction: (event: ModifierEvent) => LinkAction | null;
	/** Which tier (if any) maps to the given action in the active map. */
	tierForAction: (action: LinkAction) => keyof LinkTierMap | null;
	hint: string;
	map: LinkTierMap;
}

const TIER_ORDER: (keyof LinkTierMap)[] = [
	"plain",
	"shift",
	"meta",
	"metaShift",
];

function tierForActionIn(
	map: LinkTierMap,
	action: LinkAction,
): keyof LinkTierMap | null {
	for (const tier of TIER_ORDER) {
		if (map[tier] === action) return tier;
	}
	return null;
}

/**
 * Build a memoized policy from a tier map. Centralized so every policy hook
 * (sidebar / terminal / inline) shares identical semantics.
 */
export function buildPolicy(
	map: LinkTierMap,
	surface: Surface,
	mode: TierMode,
): ClickPolicy {
	const resolve = (event: ModifierEvent): ResolvedClick => {
		const tier = tierFor(event, mode);
		return { tier, action: map[tier] };
	};
	return {
		resolve,
		getAction: (event) => resolve(event).action,
		tierForAction: (action) => tierForActionIn(map, action),
		hint: buildHint(map, surface, mode),
		map,
	};
}

type MapKey = "fileLinks" | "urlLinks" | "sidebarFileLinks";

/**
 * Default tier maps used when user preferences are not yet loaded.
 * Matches the DEFAULT_V2_USER_PREFERENCES from the v2 user preferences schema.
 */
const DEFAULT_MAPS: Record<MapKey, LinkTierMap> = {
	fileLinks: {
		plain: "pane",
		shift: "newTab",
		meta: "pane",
		metaShift: "external",
	},
	urlLinks: {
		plain: "pane",
		shift: "newTab",
		meta: "pane",
		metaShift: "external",
	},
	sidebarFileLinks: {
		plain: "pane",
		shift: "newTab",
		meta: "pane",
		metaShift: "external",
	},
};

/**
 * Hook-based policy builder. Uses the default tier maps.
 * When v2 user preferences are available, callers should pass the actual
 * preferences map instead.
 */
export function usePolicy(
	key: MapKey,
	surface: Surface,
	mode: TierMode,
): ClickPolicy {
	const map = DEFAULT_MAPS[key];
	const resolve = useCallback(
		(event: ModifierEvent): ResolvedClick => {
			const tier = tierFor(event, mode);
			return { tier, action: map[tier] };
		},
		[map, mode],
	);
	const getAction = useCallback(
		(event: ModifierEvent) => resolve(event).action,
		[resolve],
	);
	const tierForAction = useCallback(
		(action: LinkAction) => tierForActionIn(map, action),
		[map],
	);
	const hint = useMemo(
		() => buildHint(map, surface, mode),
		[map, surface, mode],
	);
	return { resolve, getAction, tierForAction, hint, map };
}
