import { describe, expect, test } from "vitest";
import { contrastIcon } from "$playground/options";

const swatches = [
	["White", "ffffff"],
	["Dark", "1c1c1e"],
	["Violet", "7c3aed"],
	["Sky", "0284c7"],
	["Emerald", "059669"],
	["Amber", "d97706"],
	["Rose", "f43f5e"]
] as const;

const channelToLinear = (channel: number): number => {
	const normalized = channel / 255;
	return normalized <= 0.03928
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
};

const contrast = (a: string, b: string): number => {
	const l1 = luminance(a);
	const l2 = luminance(b);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

describe("contrastIcon", () => {
	test.each(swatches)("%s swatch meets non-text contrast", (_name, hex) => {
		const ink = contrastIcon(hex).slice(1);
		expect(contrast(hex, ink)).toBeGreaterThanOrEqual(3);
	});

	test.each([
		["1c1c1e", "#ffffff"],
		["7c3aed", "#ffffff"],
		["0284c7", "#ffffff"],
		["059669", "#ffffff"],
		["d97706", "#ffffff"],
		["f43f5e", "#ffffff"]
	])("uses white ink for curated accent #%s", (hex, expected) => {
		expect(contrastIcon(hex)).toBe(expected);
	});

	test.each([
		["ffffff", "#000000"],
		["fef3c7", "#000000"]
	])("uses dark ink for light custom accent #%s", (hex, expected) => {
		expect(contrastIcon(hex)).toBe(expected);
	});
});
