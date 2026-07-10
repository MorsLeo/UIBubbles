// @vitest-environment happy-dom

import { createBubbles } from "$src/index";
import type { BubbleManager } from "$src/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Manager-level accessibility behavior in happy-dom: live announcements,
 * focus return on empty, and the disclosure panel role.
 * Reduced motion is forced so the choreography settles deterministically.
 */

const mediaQueryList = (matches: boolean) =>
	({ matches, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;

const stubAnimate = () => {
	Element.prototype.animate = function () {
		let cancelled = false;
		const animation = {
			onfinish: null as (() => void) | null,
			cancel: () => {
				cancelled = true;
			}
		};
		setTimeout(() => {
			if (!cancelled) animation.onfinish?.();
		}, 0);
		return animation as unknown as Animation;
	};
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const bubbleEl = (label: string): HTMLElement => {
	const el = [...document.querySelectorAll<HTMLElement>("[role='button']")].find(
		(candidate) => candidate.getAttribute("aria-label") === label
	);
	if (!el) throw new Error(`no bubble labelled "${label}"`);
	return el;
};

// The live region is a two-node pair (one always empty); their combined text
// is the latest announcement.
const liveText = () =>
	[...document.querySelectorAll("[aria-live]")].map((node) => node.textContent).join("");

let manager: BubbleManager | undefined;

beforeEach(() => {
	window.matchMedia = (query: string) => mediaQueryList(query.includes("prefers-reduced-motion"));
	stubAnimate();
});

afterEach(async () => {
	manager?.destroy();
	manager = undefined;
	await tick();
	document.body.innerHTML = "";
});

describe("live announcements", () => {
	it("announces an added bubble by label", async () => {
		manager = createBubbles();
		manager.add({ id: "a", label: "Chat" });
		await tick();
		expect(liveText()).toBe("Chat added");
	});

	it("announces expand with the item count, then collapse", async () => {
		manager = createBubbles();
		manager.add({ id: "a", label: "a" });
		manager.add({ id: "b", label: "b" });
		await tick();

		manager.toggle();
		await tick();
		expect(liveText()).toBe("Bubbles expanded, 2 items");

		manager.toggle();
		await tick();
		expect(liveText()).toBe("Bubbles collapsed");
	});
});



describe("disclosure panel", () => {
	it("uses role=region, not dialog", async () => {
		manager = createBubbles();
		manager.add({ id: "a", label: "a", content: document.createElement("div") });
		await tick();
		expect(document.getElementById("bubble-panel-a")?.getAttribute("role")).toBe("region");
	});
});
