import { runSimulation } from "$src/behaviors/simulate";
import { MAX_FRAME_DT, MAX_STEP_DT } from "$src/physics/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let callbacks: Map<number, FrameRequestCallback>;
let nextId: number;

const pump = (now: number) => {
	const pending = [...callbacks.values()];
	callbacks.clear();
	for (const cb of pending) cb(now);
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
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("runSimulation", () => {
	it("passes the real frame time as a single step at 60fps", () => {
		const dts: number[] = [];
		runSimulation((dt) => {
			dts.push(dt);
			return false;
		});

		pump(0);
		pump(16.7);
		// First frame has no elapsed time; the second is one real-time step.
		expect(dts).toHaveLength(2);
		expect(dts[1]).toBeCloseTo(0.0167);
	});

	it("integrates a slow frame fully via substeps (no slow motion)", () => {
		const dts: number[] = [];
		runSimulation((dt) => {
			dts.push(dt);
			return false;
		});

		pump(0);
		dts.length = 0;
		// One 33ms frame (30fps) must advance 33ms of simulation time.
		pump(33.4);
		expect(dts.reduce((sum, dt) => sum + dt, 0)).toBeCloseTo(0.0334);
		for (const dt of dts) expect(dt).toBeLessThanOrEqual(MAX_STEP_DT);
	});

	it("caps a stall at the frame budget instead of leaping", () => {
		const dts: number[] = [];
		runSimulation((dt) => {
			dts.push(dt);
			return false;
		});

		pump(0);
		dts.length = 0;
		// Five seconds in a background tab integrate as one capped frame.
		pump(5000);
		expect(dts.reduce((sum, dt) => sum + dt, 0)).toBeCloseTo(MAX_FRAME_DT);
	});

	it("stops scheduling frames once the step settles", () => {
		let calls = 0;
		runSimulation(() => {
			calls++;
			return true;
		});

		pump(0);
		expect(calls).toBe(1);
		expect(callbacks.size).toBe(0);
	});

	it("stops mid-frame when a substep settles", () => {
		let calls = 0;
		runSimulation(() => {
			calls++;
			return calls === 2;
		});

		pump(0);
		pump(100); // Would be several substeps, but the second one settles.
		expect(calls).toBe(2);
		expect(callbacks.size).toBe(0);
	});

	it("cancel stops future frames", () => {
		let calls = 0;
		const cancel = runSimulation(() => {
			calls++;
			return false;
		});

		pump(0);
		cancel();
		pump(16.7);
		expect(calls).toBe(1);
	});
});
