// Phase 4: Billing types (migrated from Superset @superset/shared/billing)
// Minimal stub — full billing integration is a future phase.

export interface BillingInfo {
  plan: "free" | "pro" | "enterprise";
  status: "active" | "past_due" | "canceled" | "trialing";
  currentPeriodEnd?: string;
  usageLimit?: number;
  usageCurrent?: number;
}
