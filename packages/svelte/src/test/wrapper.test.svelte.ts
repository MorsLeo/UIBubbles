// @vitest-environment happy-dom

import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Fixture from "./Fixture.svelte";

/**
 * The declarative lifecycle exercised through the real core in happy-dom.
 * Same determinism setup as the core's events.test.ts: reduced motion is
 * forced on and WAAPI is stubbed to finish on the next macrotask, so
 * animated exits land on a tick we control.
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

const bubbleEl = (label: string): HTMLElement | null =>
	document.querySelector<HTMLElement>(`[role="button"][aria-label="${label}"]`);

let app: object | undefined;

const mountFixture = (props: Record<string, unknown>) => {
	app = mount(Fixture, { target: document.body, props });
	flushSync();
};

beforeEach(() => {
	window.matchMedia = (query: string) => mediaQueryList(query.includes("prefers-reduced-motion"));
	stubAnimate();
});

afterEach(async () => {
	if (app) unmount(app);
	app = undefined;
	await tick();
	document.body.innerHTML = "";
});

it("mounts a declared <Bubble> into the overlay, snippets included", () => {
	mountFixture({ label: "Chat", note: "hello" });

	const el = bubbleEl("Chat");
	expect(el).not.toBeNull();
	expect(el?.querySelector("[data-testid='icon']")?.textContent).toBe("C");
	// The panel content mounted through the content host, off in the overlay.
	expect(document.querySelector("[data-testid='note']")?.textContent).toBe("hello");
});

it("refreshes a changed label in place — same element, new name", () => {
	const props = $state({ label: "Chat" });
	mountFixture(props);
	const el = bubbleEl("Chat");

	props.label = "Support";
	flushSync();

	expect(bubbleEl("Support")).toBe(el);
	expect(bubbleEl("Chat")).toBeNull();
});

it("keeps snippet content reactive through the mounted host", () => {
	const props = $state({ note: "hello" });
	mountFixture(props);

	props.note = "world";
	flushSync();

	expect(document.querySelector("[data-testid='note']")?.textContent).toBe("world");
});

it("removes the bubble when the <Bubble> leaves the markup", async () => {
	const props = $state({ showBubble: true });
	mountFixture(props);
	expect(bubbleEl("Chat")).not.toBeNull();

	props.showBubble = false;
	flushSync();
	await tick();

	expect(bubbleEl("Chat")).toBeNull();
});

it("reports a refused add via onRejected", () => {
	const onRejected = vi.fn();
	mountFixture({ maxBubbles: 1, showSecond: true, onRejected });

	expect(bubbleEl("Chat")).not.toBeNull();
	expect(bubbleEl("Extra")).toBeNull();
	expect(onRejected).toHaveBeenCalledOnce();
});

it("tears the whole overlay down when <Bubbles> unmounts", () => {
	mountFixture({});
	expect(bubbleEl("Chat")).not.toBeNull();

	if (app) unmount(app);
	app = undefined;

	expect(document.querySelector("[role='button']")).toBeNull();
	expect(document.querySelector("[data-testid='note']")).toBeNull();
});
