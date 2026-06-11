import { describe, expect, it } from "vitest";
import { FRICTION } from "$src/physics/config";
import { frictionDecay, projectDistance } from "$src/physics/friction";

describe("frictionDecay", () => {
	it("is 1 for a zero-length step", () => {
		expect(frictionDecay(0)).toBe(1);
	});

	it("leaves FRICTION of the velocity after one second", () => {
		expect(frictionDecay(1)).toBeCloseTo(FRICTION);
	});

	it("composes across split steps (frame-rate independence)", () => {
		expect(frictionDecay(0.4) * frictionDecay(0.6)).toBeCloseTo(frictionDecay(1));
	});
});

describe("projectDistance", () => {
	it("projects zero velocity nowhere", () => {
		expect(projectDistance(0)).toBe(0);
	});

	it("preserves throw direction", () => {
		expect(projectDistance(1000)).toBeGreaterThan(0);
		expect(projectDistance(-1000)).toBeLessThan(0);
	});

	it("matches a numerical integration of the decay", () => {
		const dt = 0.001;
		let position = 0;
		let velocity = 2000;
		for (let t = 0; t < 10; t += dt) {
			position += velocity * dt;
			velocity *= frictionDecay(dt);
		}
		expect(position).toBeCloseTo(projectDistance(2000), -1);
	});
});
