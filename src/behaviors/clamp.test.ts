import { clampTop, maxRestTop } from "$src/behaviors/clamp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const fakeEl = (): HTMLElement => ({ offsetHeight: 56 }) as unknown as HTMLElement;

beforeAll(() => {
	vi.stubGlobal("window", { innerHeight: 800 });
});

afterAll(() => {
	vi.unstubAllGlobals();
});

describe("maxRestTop", () => {
	it("keeps the bottom edge gap", () => {
		// 800 viewport - 56 bubble - 12 gap.
		expect(maxRestTop(fakeEl())).toBe(732);
	});
});

describe("clampTop", () => {
	it("passes through an in-bounds position", () => {
		expect(clampTop(fakeEl(), 400)).toBe(400);
	});

	it("clamps to the top edge gap", () => {
		expect(clampTop(fakeEl(), -50)).toBe(12);
	});

	it("clamps to the bottom edge gap", () => {
		expect(clampTop(fakeEl(), 9999)).toBe(732);
	});
});
