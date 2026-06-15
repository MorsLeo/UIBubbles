// @vitest-environment happy-dom

import { resolveSlot } from "$src/elements/slot";
import { createBubbles } from "$src/index";
import type { BubbleManager } from "$src/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Render-callback slots: `resolveSlot` in isolation, then the teardown
 * lifecycle through the real manager in happy-dom. Reduced motion is forced
 * so exits resolve on a known timer (see the WAAPI stub), matching the
 * event tests' harness.
 */

const mediaQueryList = (matches: boolean) =>
	({
		matches,
		addEventListener: () => {},
		removeEventListener: () => {}
	}) as unknown as MediaQueryList;

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

/** One macrotask turn: lets stubbed fades finish and microtask flushes land. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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

describe("resolveSlot", () => {
	it("passes a ready element straight through, with no teardown", () => {
		const el = document.createElement("span");
		expect(resolveSlot(el)).toEqual({ el });
	});

	it("returns an empty result for an absent slot", () => {
		expect(resolveSlot(undefined)).toEqual({});
	});

	it("hands a render callback a fresh host element and keeps its teardown", () => {
		const teardown = vi.fn();
		const render = vi.fn((host: HTMLElement) => {
			host.textContent = "hi";
			return teardown;
		});

		const { el, teardown: captured } = resolveSlot(render);

		expect(render).toHaveBeenCalledOnce();
		expect(el).toBeInstanceOf(HTMLElement);
		expect(el?.textContent).toBe("hi");
		expect(captured).toBe(teardown);
		expect(teardown).not.toHaveBeenCalled();
	});

	it("treats a callback that returns nothing as having no teardown", () => {
		expect(resolveSlot(() => {}).teardown).toBeUndefined();
	});
});

describe("render-callback slots through the manager", () => {
	it("invokes each render callback once, with its own host element, on add", () => {
		manager = createBubbles();
		let iconHost: HTMLElement | undefined;
		let contentHost: HTMLElement | undefined;
		const icon = vi.fn((host: HTMLElement) => void (iconHost = host));
		const content = vi.fn((host: HTMLElement) => void (contentHost = host));

		manager.add({ id: "a", label: "A", icon, content });

		expect(icon).toHaveBeenCalledOnce();
		expect(content).toHaveBeenCalledOnce();
		expect(iconHost).toBeInstanceOf(HTMLElement);
		expect(contentHost).toBeInstanceOf(HTMLElement);
		expect(iconHost).not.toBe(contentHost);
	});

	it("runs both icon and content teardowns when the bubble is removed", async () => {
		manager = createBubbles();
		const iconTeardown = vi.fn();
		const contentTeardown = vi.fn();

		manager.add({
			id: "a",
			label: "A",
			icon: () => iconTeardown,
			content: () => contentTeardown
		});
		await tick();
		expect(iconTeardown).not.toHaveBeenCalled();

		manager.remove("a");
		await tick(); // the off-screen retire fade finishes...
		await tick(); // ...then removeById runs the teardowns

		expect(iconTeardown).toHaveBeenCalledOnce();
		expect(contentTeardown).toHaveBeenCalledOnce();
	});

	it("runs teardowns synchronously on destroy", () => {
		manager = createBubbles();
		const teardown = vi.fn();
		manager.add({ id: "a", label: "A", content: () => teardown });

		manager.destroy();

		expect(teardown).toHaveBeenCalledOnce();
	});

	it("does not re-run a render callback on re-add — the icon and content live on", () => {
		manager = createBubbles();
		const content = vi.fn(() => () => {});

		manager.add({ id: "a", label: "A", content });
		manager.add({ id: "a", label: "A again", content });

		expect(content).toHaveBeenCalledOnce();
	});
});
