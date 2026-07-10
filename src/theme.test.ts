import { bubbleThemes, resolveTheme, systemThemeName } from "$src/theme";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("systemThemeName", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("maps the prefers-color-scheme match to a preset name", () => {
		vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
		expect(systemThemeName()).toBe("dark");

		vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
		expect(systemThemeName()).toBe("light");
	});
});

describe("resolveTheme", () => {
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
