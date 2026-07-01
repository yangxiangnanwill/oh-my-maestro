// Re-export shim: logic moved to the shared layer so renderer code can import
// isSafeExternalUrl/externalUrlLogLabel without depending on main. This file
// is kept (not deleted) to preserve the `from "./scheme"` import chain used by
// safe-url.ts, safe-url/index.ts, and safe-url.test.ts.
export { externalUrlLogLabel, isSafeExternalUrl } from "shared/safe-url";
