import { describe, expect, it } from "vitest";
import { springStep } from "$src/physics/spring";
import type { AxisState } from "$src/types";

const simulate = (initial: AxisState, target: number, seconds: number) => {
	const dt = 1 / 240;
	let state = initial;
	let minPosition = initial.position;
	let maxPosition = initial.position;
	for (let t = 0; t < seconds; t += dt) {
		state = springStep(state, target, dt);
		minPosition = Math.min(minPosition, state.position);
		maxPosition = Math.max(maxPosition, state.position);
	}
	return { state, minPosition, maxPosition };
};

describe("springStep", () => {
	it("settles at the target with no residual velocity", () => {
		const { state } = simulate({ position: 0, velocity: 0 }, 100, 5);
		expect(state.position).toBeCloseTo(100, 1);
		expect(Math.abs(state.velocity)).toBeLessThan(1);
	});

	it("overshoots the target slightly (underdamped feel)", () => {
		const { maxPosition } = simulate({ position: 0, velocity: 0 }, 100, 5);
		expect(maxPosition).toBeGreaterThan(100);
	});

	it("lets initial velocity carry away from the target before returning", () => {
		const { minPosition, state } = simulate({ position: 0, velocity: -500 }, 100, 5);
		expect(minPosition).toBeLessThan(0);
		expect(state.position).toBeCloseTo(100, 1);
	});
});
