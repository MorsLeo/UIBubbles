import { createBubbles } from "$src/index";
import { describe, expect, it } from "vitest";

describe("createBubbles", () => {
	it("returns a manager", () => {
		const manager = createBubbles();
		expect(manager.add).toBeTypeOf("function");
		expect(manager.remove).toBeTypeOf("function");
		expect(manager.destroy).toBeTypeOf("function");
	});

	it("accepts options without touching the DOM", () => {
		const manager = createBubbles({ theme: "light", side: "left", vertical: 0.3 });
		expect(manager.toggle).toBeTypeOf("function");
	});

	it("reconfigures without touching the DOM while no bubbles exist", () => {
		const manager = createBubbles();
		manager.configure({ theme: "light", panelWidth: 480 });
		manager.destroy();
	});

	it("reports the configured initial state while no bubbles exist", () => {
		expect(createBubbles().state()).toBe("docked");
		expect(createBubbles({ initialState: "open" }).state()).toBe("open");
	});
});
