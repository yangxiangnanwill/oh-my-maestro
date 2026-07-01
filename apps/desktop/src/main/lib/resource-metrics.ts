// Phase 4 stub: main/lib/resource-metrics
// Migrated from Superset resource metrics collection

import type { ResourceMetricsSnapshot } from "../../lib/trpc/routers/resource-metrics.schema";
import { createFallbackResourceMetricsSnapshot } from "../../lib/trpc/routers/resource-metrics.schema";

export interface CollectResourceMetricsOptions {
	mode?: "interactive" | "idle";
	force?: boolean;
	surface?: "v1" | "v2";
	organizationId?: string;
}

export async function collectResourceMetrics(
	_options?: CollectResourceMetricsOptions,
): Promise<ResourceMetricsSnapshot> {
	// Phase 4 stub - returns fallback snapshot
	return createFallbackResourceMetricsSnapshot();
}
