import { createBubbles } from "$src/index";
import { describe, expect, it } from "vitest";

describe("createBubbles", () => {
	it("returns a manager", () => {
		const manager = createBubbles();
		expect(manager.add).toBeTypeOf("function");
		expect(manager.remove).toBeTypeOf("function");
		expect(manager.destroy).toBeTypeOf("function");
	});
});
