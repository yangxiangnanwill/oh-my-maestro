// TODO: Phase 5 — useCurrentPlan
// This hook depends on @superset/shared/billing, @tanstack/react-db, and
// renderer/routes/_authenticated/providers/CollectionsProvider which will be
// migrated in a later phase.
// For now, this is a stub that returns a default "free" plan.

export type PlanTier = "free" | "pro" | "enterprise";

export function resolveCurrentPlan(): PlanTier {
	return "free";
}

export function useCurrentPlan(): { plan: PlanTier; isReady: boolean } {
	return { plan: "free", isReady: true };
}
