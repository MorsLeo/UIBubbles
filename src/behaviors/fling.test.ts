import { startFling } from "$src/behaviors/fling";
import { REST_DISTANCE } from "$src/physics/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SIZE = 56;

interface FakeBubble {
	el: HTMLElement;
	left(): number;
	top(): number;
	side(): string | undefined;
}

const fakeBubble = (left: number, top: number): FakeBubble => {
	const style = { left: `${left}px`, top: `${top}px` };
	const dataset: Record<string, string> = {};
	const el = {
		offsetWidth: SIZE,
		offsetHeight: SIZE,
		dataset,
		style,
		getBoundingClientRect: () => ({ left, top, width: SIZE, height: SIZE })
	} as unknown as HTMLElement;
	return {
		el,
		left: () => parseFloat(style.left),
		top: () => parseFloat(style.top),
		side: () => dataset.bubbleSide
	};
};

let callbacks: Map<number, FrameRequestCallback>;
let nextId: number;

/** Pumps rAF frames until the simulation settles (or a generous sim-time cap). */
const settle = () => {
	let now = 0;
	const pending = () => [...callbacks.values()];
	while (callbacks.size > 0 && now < 30_000) {
		const frame = pending();
		callbacks.clear();
		for (const cb of frame) cb(now);
		now += 16.7;
	}
	expect(callbacks.size).toBe(0); // The fling must come to rest on its own.
};

beforeEach(() => {
	callbacks = new Map();
	nextId = 0;
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
		callbacks.set(++nextId, cb);
		return nextId;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => {
		callbacks.delete(id);
	});
	vi.stubGlobal("window", {
		innerWidth: 1000,
		innerHeight: 800,
		matchMedia: () => ({ matches: false })
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("startFling", () => {
	it("lands a rightward throw on the right wall", () => {
		const bubble = fakeBubble(472, 400);
		const onRest = vi.fn();

		startFling(bubble.el, { x: 1500, y: 0 }, onRest);
		settle();

		// 1000 viewport - 56 bubble - 12 gap.
		expect(bubble.left()).toBe(932);
		expect(bubble.side()).toBe("right");
		expect(onRest).toHaveBeenCalledTimes(1);
	});

	it("lands a leftward throw on the left wall", () => {
		const bubble = fakeBubble(472, 400);

		startFling(bubble.el, { x: -1500, y: 0 }, vi.fn());
		settle();

		expect(bubble.left()).toBe(12);
		expect(bubble.side()).toBe("left");
	});

	it("picks the wall from the projected coast, not the release point", () => {
		// Released on the right half but thrown hard left: the projection
		// crosses the midline, so the bubble must travel to the left wall.
		const bubble = fakeBubble(600, 400);

		startFling(bubble.el, { x: -2000, y: 0 }, vi.fn());
		settle();

		expect(bubble.left()).toBe(12);
		expect(bubble.side()).toBe("left");
	});

	it("springs a bubble released above the screen back to the top gap", () => {
		const bubble = fakeBubble(932, -120);

		startFling(bubble.el, { x: 0, y: 0 }, vi.fn());
		settle();

		// Only the horizontal axis hard-snaps at rest; the vertical return
		// settles wherever the spring's rest threshold lets go, clamped in.
		expect(bubble.top()).toBeGreaterThanOrEqual(12);
		expect(bubble.top()).toBeLessThan(12 + REST_DISTANCE);
	});

	it("keeps a hard vertical throw inside the vertical gaps", () => {
		const bubble = fakeBubble(472, 400);

		startFling(bubble.el, { x: 800, y: 4000 }, vi.fn());
		settle();

		// Ricochets decay, so the exact rest height varies — the contract
		// is that it never rests past either gap: 12 ≤ top ≤ 732.
		expect(bubble.top()).toBeGreaterThanOrEqual(12);
		expect(bubble.top()).toBeLessThanOrEqual(732);
	});

	it("cancelling mid-flight suppresses onRest and stops the frames", () => {
		const bubble = fakeBubble(472, 400);
		const onRest = vi.fn();

		const cancel = startFling(bubble.el, { x: 1500, y: 0 }, onRest);
		const first = [...callbacks.values()];
		callbacks.clear();
		for (const cb of first) cb(0);
		cancel();

		expect(callbacks.size).toBe(0);
		expect(onRest).not.toHaveBeenCalled();
	});
});
