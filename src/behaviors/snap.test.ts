import {
	chooseSide,
	clearSnappedSide,
	getSnappedSide,
	setSnappedSide,
	sideRestLeft
} from "$src/behaviors/snap";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const fakeEl = (): HTMLElement => ({ offsetWidth: 56, dataset: {} }) as unknown as HTMLElement;

beforeAll(() => {
	vi.stubGlobal("window", { innerWidth: 1000 });
});

afterAll(() => {
	vi.unstubAllGlobals();
});

describe("chooseSide", () => {
	it("picks left for a projected center left of the midline", () => {
		expect(chooseSide(499)).toBe("left");
	});

	it("picks right from the midline on", () => {
		expect(chooseSide(500)).toBe("right");
	});
});

describe("sideRestLeft", () => {
	it("rests against the left edge gap", () => {
		expect(sideRestLeft(fakeEl(), "left")).toBe(12);
	});

	it("rests against the right edge gap", () => {
		// 1000 viewport - 56 bubble - 12 gap.
		expect(sideRestLeft(fakeEl(), "right")).toBe(932);
	});
});

describe("snapped side", () => {
	it("round-trips through the element", () => {
		const el = fakeEl();
		expect(getSnappedSide(el)).toBeUndefined();

		setSnappedSide(el, "left");
		expect(getSnappedSide(el)).toBe("left");

		clearSnappedSide(el);
		expect(getSnappedSide(el)).toBeUndefined();
	});
});
