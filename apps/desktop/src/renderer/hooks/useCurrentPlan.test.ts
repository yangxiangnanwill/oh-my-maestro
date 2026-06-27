import { describe, expect, it } from "bun:test";
import { resolveCurrentPlan } from "./useCurrentPlan";

describe("resolveCurrentPlan", () => {
	it("returns free as default", () => {
		expect(resolveCurrentPlan()).toBe("free");
	});
});
