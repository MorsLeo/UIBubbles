import { SPRING_DAMPING, SPRING_STIFFNESS } from "$src/physics/config";
import type { AxisState } from "$src/types";

/**
 * One damped-spring integration step toward `target` over `dt` seconds
 * (semi-implicit Euler — stable at our step sizes and dirt cheap).
 */
export const springStep = (state: AxisState, target: number, dt: number): AxisState => {
	const acceleration =
		SPRING_STIFFNESS * (target - state.position) - SPRING_DAMPING * state.velocity;
	const velocity = state.velocity + acceleration * dt;
	return { position: state.position + velocity * dt, velocity };
};
