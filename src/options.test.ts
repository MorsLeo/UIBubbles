import { MAX_BUBBLES } from "$src/constants";
import { DEFAULT_PANEL_WIDTH, resolveOptions } from "$src/options";
import { bubbleThemes } from "$src/theme";
import { describe, expect, it } from "vitest";

describe("resolveOptions", () => {
	it("applies every default", () => {
		const resolved = resolveOptions();

		expect(resolved.theme).toEqual(bubbleThemes.dark);
		expect(resolved.side).toBe("right");
		expect(resolved.vertical).toBe(0.5);
		expect(resolved.panelWidth).toBe(DEFAULT_PANEL_WIDTH);
		expect(resolved.panelMaxHeight).toBeUndefined();
		expect(resolved.maxBubbles).toBe(MAX_BUBBLES);
	});

	it("passes explicit choices through", () => {
		const resolved = resolveOptions({
			theme: "light",
			side: "left",
			vertical: 0.25,
			panelWidth: 420,
			panelMaxHeight: 600,
			maxBubbles: 3
		});

		expect(resolved.theme).toEqual(bubbleThemes.light);
		expect(resolved.side).toBe("left");
		expect(resolved.vertical).toBe(0.25);
		expect(resolved.panelWidth).toBe(420);
		expect(resolved.panelMaxHeight).toBe(600);
		expect(resolved.maxBubbles).toBe(3);
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
