// @vitest-environment happy-dom

import { createBubbles } from "$src/index";
import type { BubbleManager } from "$src/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Event, active(), and activate() flows exercised through the real
 * manager in happy-dom. Reduced motion is forced on so the choreography
 * is deterministic: glides settle in one frame and every exit is a
 * stubbed fade that finishes on a known timer, while the semantics
 * under test (state, active, add/remove) are identical either way.
 */

// happy-dom's matchMedia never matches; the library reads the
// preference live at each animation, so a per-query stub is enough.
const mediaQueryList = (matches: boolean) =>
	({
		matches,
		addEventListener: () => {},
		removeEventListener: () => {}
	}) as unknown as MediaQueryList;

// Minimal WAAPI stand-in for the reduced-motion fades: finishes on the
// next macrotask unless cancelled, so a retire's onGone (and thus the
// deferred remove event) lands on a tick we control.
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

type Logged = { event: string; detail: unknown };

/** Subscribes to every event, appending deliveries in arrival order. */
const logEvents = (manager: BubbleManager): Logged[] => {
	const log: Logged[] = [];
	for (const event of ["statechange", "activechange", "add", "dismiss", "remove"] as const) {
		manager.on(event, (detail) => log.push({ event, detail }));
	}
	return log;
};

const only = (log: Logged[], event: string) => log.filter((entry) => entry.event === event);

/** The mounted bubble element for an id — tests that need one give it that label. */
const bubbleEl = (label: string): HTMLElement => {
	const els = [...document.querySelectorAll<HTMLElement>("[role='button']")];
	const el = els.find((candidate) => candidate.getAttribute("aria-label") === label);
	if (!el) throw new Error(`no bubble element labelled "${label}"`);
	return el;
};

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

describe("on", () => {
	it("delivers statechange when configure changes the empty-flock state", async () => {
		manager = createBubbles();
		const log = logEvents(manager);

		manager.configure({ initialState: "open" });
		await tick();
		expect(log).toEqual([{ event: "statechange", detail: { state: "open" } }]);

		manager.configure({});
		await tick();
		expect(log[1]).toEqual({ event: "statechange", detail: { state: "docked" } });
	});

	it("stops delivering after unsubscribe", async () => {
		manager = createBubbles();
		const seen: unknown[] = [];
		const off = manager.on("statechange", (detail) => seen.push(detail));

		off();
		manager.configure({ initialState: "open" });
		await tick();
		expect(seen).toEqual([]);
	});

	it("coalesces a flip that lands back where it started", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		await tick();
		const log = logEvents(manager);

		manager.toggle();
		manager.toggle();
		await tick();
		expect(log).toEqual([]);
	});

	it("does not replay past changes to a late subscriber", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.toggle();
		await tick();

		const log = logEvents(manager);
		await tick();
		expect(log).toEqual([]);
	});
});

describe("add and remove events", () => {
	it("fires add for fresh mounts only", async () => {
		manager = createBubbles();
		const log = logEvents(manager);

		manager.add({ id: "chat" });
		await tick();
		expect(log).toEqual([
			{ event: "add", detail: { id: "chat" } },
			{ event: "activechange", detail: { id: "chat" } }
		]);

		// A re-add refreshes in place — nothing new mounted.
		manager.add({ id: "chat", label: "Chat" });
		await tick();
		expect(only(log, "add")).toHaveLength(1);
	});

	it("reports a programmatic removal only once the bubble is gone", async () => {
		manager = createBubbles();
		const log = logEvents(manager);
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();

		manager.remove("a");
		// The exit is still animating; remove waits for it.
		expect(only(log, "remove")).toEqual([]);

		await tick();
		await tick();
		expect(only(log, "remove")).toEqual([
			{ event: "remove", detail: { id: "a", reason: "programmatic" } }
		]);
	});

	it("never fires remove (or add) for a removal a re-add reverses", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();
		const log = logEvents(manager);

		manager.remove("b");
		manager.add({ id: "b" });
		await tick();
		await tick();
		expect(log).toEqual([]);
	});

	it("runs onDismiss before the user-removal event delivers", async () => {
		const order: string[] = [];
		manager = createBubbles();
		manager.add({ id: "a", label: "a", onDismiss: () => order.push("onDismiss") });
		manager.add({ id: "b", label: "b" });
		manager.toggle();
		await tick();
		manager.on("remove", ({ id, reason }) => order.push(`remove:${id}:${reason}`));

		// Delete is the user dismissal reachable without a pointer; it only
		// acts on an open row, hence the toggle above.
		bubbleEl("a").dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
		await tick();
		expect(order).toEqual(["onDismiss", "remove:a:user"]);
	});

	it("fires dismiss at commit for a user dismissal, ahead of remove", async () => {
		manager = createBubbles();
		manager.add({ id: "a", label: "a" });
		manager.add({ id: "b", label: "b" });
		manager.toggle();
		await tick();
		const log = logEvents(manager);

		bubbleEl("a").dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
		await tick();
		await tick();

		// dismiss (commit) precedes remove (gone), for the same id.
		expect(log.filter((e) => e.event === "dismiss" || e.event === "remove")).toEqual([
			{ event: "dismiss", detail: { id: "a" } },
			{ event: "remove", detail: { id: "a", reason: "user" } }
		]);
	});

	it("does not fire dismiss for a programmatic removal", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();
		const log = logEvents(manager);

		manager.remove("a");
		await tick();
		await tick();

		expect(only(log, "dismiss")).toEqual([]);
		expect(only(log, "remove")).toContainEqual({
			event: "remove",
			detail: { id: "a", reason: "programmatic" }
		});
	});

	it("reports every bubble on destroy and clears active", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();
		const log = logEvents(manager);

		manager.destroy();
		await tick();
		expect(only(log, "remove")).toEqual([
			{ event: "remove", detail: { id: "a", reason: "programmatic" } },
			{ event: "remove", detail: { id: "b", reason: "programmatic" } }
		]);
		expect(manager.active()).toBeUndefined();
	});
});

describe("active and activate", () => {
	it("is undefined with no bubbles, and activate of an unknown id is a no-op", () => {
		manager = createBubbles();
		expect(manager.active()).toBeUndefined();
		expect(() => manager!.activate("nope")).not.toThrow();
	});

	it("tracks the newest bubble across distinct interactions", async () => {
		manager = createBubbles();
		const log = logEvents(manager);

		manager.add({ id: "a" });
		await tick();
		manager.add({ id: "b" });
		await tick();

		expect(manager.active()).toBe("b");
		expect(only(log, "activechange")).toEqual([
			{ event: "activechange", detail: { id: "a" } },
			{ event: "activechange", detail: { id: "b" } }
		]);
	});

	it("coalesces same-tick adds to the final active bubble", async () => {
		manager = createBubbles();
		const log = logEvents(manager);

		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();

		// The intermediate "a" never gets its own delivery — diffing runs
		// once per flush, against the value last delivered.
		expect(manager.active()).toBe("b");
		expect(only(log, "activechange")).toEqual([{ event: "activechange", detail: { id: "b" } }]);
	});

	it("expands a docked group on the chosen bubble", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();
		const log = logEvents(manager);

		manager.activate("a");
		await tick();

		expect(manager.state()).toBe("open");
		expect(manager.active()).toBe("a");
		expect(log).toEqual([
			{ event: "statechange", detail: { state: "open" } },
			{ event: "activechange", detail: { id: "a" } }
		]);
	});

	it("switches the open row without changing state", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		manager.activate("a");
		await tick();
		const log = logEvents(manager);

		manager.activate("b");
		await tick();

		expect(manager.active()).toBe("b");
		expect(log).toEqual([{ event: "activechange", detail: { id: "b" } }]);
	});

	it("is idempotent on the already-active bubble of an open group", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.activate("a");
		await tick();
		const log = logEvents(manager);

		manager.activate("a");
		await tick();
		expect(log).toEqual([]);
	});

	it("ignores a bubble that is mid-removal", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.add({ id: "b" });
		await tick();

		manager.remove("b");
		manager.activate("b");
		expect(manager.active()).toBe("a");
	});

	it("clears active and reverts state once the flock empties", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.toggle();
		await tick();
		const log = logEvents(manager);

		manager.remove("a");
		await tick();
		await tick();

		expect(manager.state()).toBe("docked");
		expect(manager.active()).toBeUndefined();
		expect(only(log, "remove")).toEqual([
			{ event: "remove", detail: { id: "a", reason: "programmatic" } }
		]);
		// The exit hands the active panel off immediately but only reverts
		// to "docked" once the bubble is gone, so both land by the end.
		expect(log).toContainEqual({ event: "statechange", detail: { state: "docked" } });
		expect(log).toContainEqual({ event: "activechange", detail: { id: undefined } });
	});
});

describe("outside press (tap-away)", () => {
	const pressOutside = (el: EventTarget) =>
		el.dispatchEvent(new Event("pointerdown", { bubbles: true }));

	it("collapses an open group", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		manager.activate("a");
		await tick();
		expect(manager.state()).toBe("open");

		pressOutside(document.body.appendChild(document.createElement("div")));
		await tick();
		expect(manager.state()).toBe("docked");
	});

	it("exempts a registered trigger, and the unregister restores tap-away", async () => {
		manager = createBubbles();
		manager.add({ id: "a" });
		const trigger = document.body.appendChild(document.createElement("button"));
		const unregister = manager.registerTrigger(trigger);

		manager.activate("a");
		await tick();
		expect(manager.state()).toBe("open");

		// A press on the registered trigger is the trigger doing its job.
		pressOutside(trigger);
		await tick();
		expect(manager.state()).toBe("open");

		// Unregistered, the same press collapses like any outside press.
		unregister();
		pressOutside(trigger);
		await tick();
		expect(manager.state()).toBe("docked");
	});
});
