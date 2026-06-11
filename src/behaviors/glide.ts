import { runSimulation } from "$src/behaviors/simulate";
import { REST_DISTANCE, REST_VELOCITY } from "$src/physics/config";
import { springStep } from "$src/physics/spring";
import type { AxisState, GlideHooks, GlideTarget } from "$src/types";

/**
 * Spring-glides the element to a point. The target is a function so it
 * tracks viewport changes mid-flight (zoom, resize). Returns a cancel
 * function.
 */
export const startGlide = (
	el: HTMLElement,
	target: () => GlideTarget,
	hooks: GlideHooks = {}
): (() => void) => {
	const rect = el.getBoundingClientRect();
	let x: AxisState = { position: rect.left, velocity: 0 };
	let y: AxisState = { position: rect.top, velocity: 0 };

	return runSimulation((dt) => {
		const { left, top } = target();
		x = springStep(x, left, dt);
		y = springStep(y, top, dt);
		el.style.left = `${x.position}px`;
		el.style.top = `${y.position}px`;

		const atRest =
			Math.abs(x.position - left) < REST_DISTANCE &&
			Math.abs(x.velocity) < REST_VELOCITY &&
			Math.abs(y.position - top) < REST_DISTANCE &&
			Math.abs(y.velocity) < REST_VELOCITY;
		if (!atRest) {
			hooks.onFrame?.();
			return false;
		}

		el.style.left = `${left}px`;
		el.style.top = `${top}px`;
		hooks.onFrame?.();
		hooks.onRest?.();
		return true;
	});
};
