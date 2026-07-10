import { SPRING_DAMPING, SPRING_STIFFNESS } from "../physics/config.js";
/**
 * One damped-spring integration step toward `target` over `dt` seconds
 * (semi-implicit Euler — stable at our step sizes and dirt cheap).
 */
export const springStep = (state, target, dt) => {
    const acceleration = SPRING_STIFFNESS * (target - state.position) - SPRING_DAMPING * state.velocity;
    const velocity = state.velocity + acceleration * dt;
    return { position: state.position + velocity * dt, velocity };
};
//# sourceMappingURL=spring.js.map