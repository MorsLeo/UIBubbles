import { createVelocityTracker } from "$src/behaviors/velocity";
import { describe, expect, it } from "vitest";

describe("createVelocityTracker", () => {
	it("returns zero with no samples", () => {
		const tracker = createVelocityTracker();
		expect(tracker.getVelocity(0)).toEqual({ x: 0, y: 0 });
	});

	it("returns zero with a single sample", () => {
		const tracker = createVelocityTracker();
		tracker.addSample(10, 20, 0);
		expect(tracker.getVelocity(0)).toEqual({ x: 0, y: 0 });
	});

	it("measures steady motion in px/s", () => {
		const tracker = createVelocityTracker();
		// 10px right and 5px down every 16ms → 625 px/s x, 312.5 px/s y.
		for (let i = 0; i <= 5; i++) tracker.addSample(i * 10, i * 5, i * 16);
		const v = tracker.getVelocity(5 * 16);
		expect(v.x).toBeCloseTo(625);
		expect(v.y).toBeCloseTo(312.5);
	});

	it("ignores samples older than the window", () => {
		const tracker = createVelocityTracker();
		tracker.addSample(0, 0, 0);
		tracker.addSample(100, 0, 50);
		tracker.addSample(110, 0, 200);
		// Only the t=200 sample is within 100ms of now — too few to measure.
		expect(tracker.getVelocity(250)).toEqual({ x: 0, y: 0 });
	});

	it("reads zero after a fast drag that pauses before release", () => {
		const tracker = createVelocityTracker();
		for (let i = 0; i <= 5; i++) tracker.addSample(i * 50, 0, i * 16);
		// Pointer holds still (no new samples), released 300ms later.
		expect(tracker.getVelocity(5 * 16 + 300)).toEqual({ x: 0, y: 0 });
	});

	it("clears samples on reset", () => {
		const tracker = createVelocityTracker();
		tracker.addSample(0, 0, 0);
		tracker.addSample(100, 0, 50);
		tracker.reset();
		expect(tracker.getVelocity(50)).toEqual({ x: 0, y: 0 });
	});
});
