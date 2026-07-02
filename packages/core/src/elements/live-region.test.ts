// @vitest-environment happy-dom

import { createLiveRegion } from "$src/elements/live-region";
import { afterEach, describe, expect, it } from "vitest";

const regions = () => [...document.querySelectorAll<HTMLElement>("[aria-live]")];
const announced = () => regions().map((region) => region.textContent).join("");

afterEach(() => {
	document.body.innerHTML = "";
});

describe("createLiveRegion", () => {
	it("touches no DOM until the first announcement", () => {
		createLiveRegion();
		expect(regions()).toHaveLength(0);
	});

	it("announces into polite, atomic regions", () => {
		createLiveRegion().announce("Chat added");
		expect(regions().every((region) => region.getAttribute("aria-live") === "polite")).toBe(true);
		expect(regions().every((region) => region.getAttribute("aria-atomic") === "true")).toBe(true);
		expect(announced()).toBe("Chat added");
	});

	it("alternates nodes so a repeated message still changes a region", () => {
		const live = createLiveRegion();
		live.announce("Bubble added");
		const first = regions().find((region) => region.textContent === "Bubble added");
		live.announce("Bubble added");
		const second = regions().find((region) => region.textContent === "Bubble added");

		// Same text, but it moved to the other node — an unambiguous change.
		expect(second).not.toBe(first);
		expect(announced()).toBe("Bubble added");
	});

	it("keeps only the latest message across the pair", () => {
		const live = createLiveRegion();
		live.announce("first");
		live.announce("second");
		expect(regions()).toHaveLength(2);
		expect(announced()).toBe("second");
	});

	it("removes the regions on destroy", () => {
		const live = createLiveRegion();
		live.announce("x");
		live.destroy();
		expect(regions()).toHaveLength(0);
	});
});
