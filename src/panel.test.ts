// @vitest-environment happy-dom

import { createBubbles } from "$src/index";
import type { BubbleManager } from "$src/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Panel sizing exercised end to end through the manager in happy-dom: a
 * content bubble mounts its panel into the body at add() time, and
 * setAppearance has already written the width/height clamp onto it — no
 * activation needed to read the result.
 */

const mediaQueryList = (matches: boolean) =>
	({
		matches,
		addEventListener: () => {},
		removeEventListener: () => {}
	}) as unknown as MediaQueryList;

let manager: BubbleManager | undefined;

beforeEach(() => {
	window.matchMedia = (query: string) => mediaQueryList(query.includes("prefers-reduced-motion"));
	// happy-dom has no WAAPI; the reduced-motion fade-in calls animate() and
	// ignores the result, so a no-op stand-in is enough to mount a bubble.
	Element.prototype.animate = (() => ({
		onfinish: null,
		cancel: () => {}
	})) as unknown as typeof Element.prototype.animate;
});

afterEach(() => {
	manager?.destroy();
	manager = undefined;
	document.body.innerHTML = "";
});

/** Inline style of the panel a content bubble mounts (id `bubble-panel-<id>`). */
const panelStyle = (id: string): string => {
	const el = document.getElementById(`bubble-panel-${id}`);
	if (!el) throw new Error(`no panel mounted for "${id}"`);
	return el.getAttribute("style") ?? "";
};

const addPanel = (options: Parameters<BubbleManager["add"]>[0]) => {
	manager = createBubbles();
	manager.add({ content: document.createElement("div"), ...options });
};

describe("panel sizing", () => {


	it("rejects an invalid override at add()", () => {
		manager = createBubbles();
		expect(() =>
			manager!.add({
				id: "a",
				content: document.createElement("div"),
				panelMaxHeight: "80vh" as never
			})
		).toThrow(/panelMaxHeight/);
	});
});
