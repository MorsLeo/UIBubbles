import { bubbleThemes, resolveTheme } from "$src/theme";
import { describe, expect, it } from "vitest";

describe("resolveTheme", () => {
	it("defaults to the dark preset", () => {
		expect(resolveTheme()).toEqual(bubbleThemes.dark);
	});

	it("resolves a preset by name", () => {
		expect(resolveTheme("light")).toEqual(bubbleThemes.light);
	});

	it("folds overrides into the preset", () => {
		const resolved = resolveTheme("dark", { bubbleSurface: "#7c3aed" });

		expect(resolved.bubbleSurface).toBe("#7c3aed");
		expect(resolved.panelSurface).toBe(bubbleThemes.dark.panelSurface);
	});

	it("never mutates the preset", () => {
		const before = { ...bubbleThemes.light };
		resolveTheme("light", { panelText: "#ff0000" });

		expect(bubbleThemes.light).toEqual(before);
	});
});
