import { MAX_BUBBLES } from "$src/constants";
import { DEFAULT_PANEL_WIDTH, resolveOptions } from "$src/options";
import { RESTITUTION } from "$src/physics/config";
import { describe, expect, it } from "vitest";

describe("resolveOptions", () => {
	it("applies every default", () => {
		const resolved = resolveOptions();

		expect(resolved.theme).toBe("auto");
		expect(resolved.colors).toBeUndefined();
		expect(resolved.side).toBe("right");
		expect(resolved.vertical).toBe(0.5);
		expect(resolved.panelWidth).toBe(DEFAULT_PANEL_WIDTH);
		expect(resolved.panelMaxHeight).toBeUndefined();
		expect(resolved.maxBubbles).toBe(MAX_BUBBLES);
		expect(resolved.ricochet).toBe(RESTITUTION);
		expect(resolved.initialState).toBe("docked");
	});

	it("passes explicit choices through", () => {
		const resolved = resolveOptions({
			theme: "light",
			colors: { bubbleSurface: "#7c3aed" },
			side: "left",
			vertical: 0.25,
			panelWidth: 420,
			panelMaxHeight: 600,
			maxBubbles: 3,
			ricochet: 0.8,
			initialState: "open"
		});

		expect(resolved.theme).toBe("light");
		expect(resolved.colors).toEqual({ bubbleSurface: "#7c3aed" });
		expect(resolved.side).toBe("left");
		expect(resolved.vertical).toBe(0.25);
		expect(resolved.panelWidth).toBe(420);
		expect(resolved.panelMaxHeight).toBe(600);
		expect(resolved.maxBubbles).toBe(3);
		expect(resolved.ricochet).toBe(0.8);
		expect(resolved.initialState).toBe("open");
	});

	it("passes percentage panel dimensions through unchanged", () => {
		const resolved = resolveOptions({ panelWidth: "90%", panelMaxHeight: "80%" });
		expect(resolved.panelWidth).toBe("90%");
		expect(resolved.panelMaxHeight).toBe("80%");
	});

	it("rejects an unsupported panel dimension, naming the option", () => {
		expect(() => resolveOptions({ panelMaxHeight: "80vh" as never })).toThrow(/panelMaxHeight/);
		expect(() => resolveOptions({ panelWidth: -10 as never })).toThrow(/panelWidth/);
	});

	it("clamps ricochet to the 0–1 range", () => {
		expect(resolveOptions({ ricochet: -0.5 }).ricochet).toBe(0);
		expect(resolveOptions({ ricochet: 2 }).ricochet).toBe(1);
	});

	it("clamps vertical to the 0–1 range", () => {
		expect(resolveOptions({ vertical: -2 }).vertical).toBe(0);
		expect(resolveOptions({ vertical: 1.5 }).vertical).toBe(1);
	});

	it("keeps maxBubbles at least 1", () => {
		expect(resolveOptions({ maxBubbles: 0 }).maxBubbles).toBe(1);
		expect(resolveOptions({ maxBubbles: -4 }).maxBubbles).toBe(1);
	});
});
