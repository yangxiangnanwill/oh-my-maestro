/**
 * Project color constants.
 * Phase 4: migrated from Superset shared/constants/project-colors.
 */

/** Default project color (gray, no custom color). */
export const PROJECT_COLOR_DEFAULT = "gray";

/** All valid project color values. */
export const PROJECT_COLOR_VALUES = [
	"gray",
	"red",
	"orange",
	"yellow",
	"green",
	"teal",
	"blue",
	"indigo",
	"purple",
	"pink",
] as const;

/** Custom project colors for section coloring. */
export const PROJECT_CUSTOM_COLORS = [
	{ name: "Red", value: "#EF4444" },
	{ name: "Orange", value: "#F97316" },
	{ name: "Yellow", value: "#EAB308" },
	{ name: "Green", value: "#22C55E" },
	{ name: "Teal", value: "#14B8A6" },
	{ name: "Blue", value: "#3B82F6" },
	{ name: "Indigo", value: "#6366F1" },
	{ name: "Purple", value: "#A855F7" },
	{ name: "Pink", value: "#EC4899" },
];
