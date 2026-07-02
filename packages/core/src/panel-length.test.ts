import { assertPanelLength, isPanelLength, toCssLength } from "$src/panel-length";
import { describe, expect, it } from "vitest";

describe("isPanelLength", () => {
	it("accepts non-negative finite numbers (px)", () => {
		expect(isPanelLength(0)).toBe(true);
		expect(isPanelLength(480)).toBe(true);
		expect(isPanelLength(12.5)).toBe(true);
	});

	it("accepts <n>px and <n>% strings", () => {
		expect(isPanelLength("480px")).toBe(true);
		expect(isPanelLength("80%")).toBe(true);
		expect(isPanelLength("33.5%")).toBe(true);
	});

	it("rejects negative, non-finite, and non-length values", () => {
		expect(isPanelLength(-1)).toBe(false);
		expect(isPanelLength(Number.NaN)).toBe(false);
		expect(isPanelLength(Number.POSITIVE_INFINITY)).toBe(false);
		expect(isPanelLength(null)).toBe(false);
		expect(isPanelLength(undefined)).toBe(false);
		expect(isPanelLength({})).toBe(false);
	});

	it("rejects unsupported units and malformed strings", () => {
		// vh/vw are deliberately out: % resolves against the scrollbar-free
		// viewport on a fixed panel, vh would fold the scrollbar back in.
		expect(isPanelLength("80vh")).toBe(false);
		expect(isPanelLength("80vw")).toBe(false);
		expect(isPanelLength("80em")).toBe(false);
		expect(isPanelLength("80")).toBe(false);
		expect(isPanelLength("80 %")).toBe(false);
		expect(isPanelLength("auto")).toBe(false);
		expect(isPanelLength("-20px")).toBe(false);
		expect(isPanelLength("")).toBe(false);
	});
});

describe("assertPanelLength", () => {
	it("passes undefined and valid values", () => {
		expect(() => assertPanelLength(undefined, "panelWidth")).not.toThrow();
		expect(() => assertPanelLength(480, "panelWidth")).not.toThrow();
		expect(() => assertPanelLength("80%", "panelMaxHeight")).not.toThrow();
	});

	it("throws naming the offending option", () => {
		expect(() => assertPanelLength("80vh" as never, "panelMaxHeight")).toThrow(/panelMaxHeight/);
		expect(() => assertPanelLength(-5 as never, "panelWidth")).toThrow(/panelWidth/);
	});
});

describe("toCssLength", () => {
	it("suffixes a bare number with px", () => {
		expect(toCssLength(480)).toBe("480px");
		expect(toCssLength(0)).toBe("0px");
	});

	it("returns a string length unchanged", () => {
		expect(toCssLength("80%")).toBe("80%");
		expect(toCssLength("420px")).toBe("420px");
	});
});
