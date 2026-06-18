// @vitest-environment happy-dom

import { createGroupOwner } from "$src/elements/group-owner";
import { afterEach, describe, expect, it } from "vitest";

const groupEl = () => document.querySelector("[role='group']");

afterEach(() => {
	document.body.innerHTML = "";
});

describe("createGroupOwner", () => {
	it("mounts a hidden role=group element", () => {
		createGroupOwner();
		expect(groupEl()).not.toBeNull();
	});

	it("owns the given ids and names itself by count", () => {
		createGroupOwner().sync(["bubble-a", "bubble-b"]);
		expect(groupEl()?.getAttribute("aria-owns")).toBe("bubble-a bubble-b");
		expect(groupEl()?.getAttribute("aria-label")).toBe("2 bubbles");
	});

	it("uses the singular for a lone bubble", () => {
		createGroupOwner().sync(["bubble-a"]);
		expect(groupEl()?.getAttribute("aria-label")).toBe("1 bubble");
	});

	it("removes the element on destroy", () => {
		createGroupOwner().destroy();
		expect(groupEl()).toBeNull();
	});
});
