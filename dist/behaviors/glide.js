import { prefersReducedMotion } from "../behaviors/reduced-motion.js";
import { runSimulation } from "../behaviors/simulate.js";
import { REST_DISTANCE, REST_VELOCITY } from "../physics/config.js";
import { springStep } from "../physics/spring.js";
/**
 * Spring-glides the element to a point. The target is a function so it
 * tracks viewport changes mid-flight (zoom, resize). Returns a cancel
 * function.
 */
export const startGlide = (el, target, hooks = {}) => {
    // Reduced motion skips the journey but keeps the contracts: still one
    // async tick, so cancel handles and rest bookkeeping work unchanged.
    if (prefersReducedMotion()) {
        return runSimulation(() => {
            const { left, top } = target();
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
            hooks.onFrame?.();
            hooks.onRest?.();
            return true;
        });
    }
    const rect = el.getBoundingClientRect();
    let x = { position: rect.left, velocity: hooks.initialVelocity?.x ?? 0 };
    let y = { position: rect.top, velocity: hooks.initialVelocity?.y ?? 0 };
    return runSimulation((dt) => {
        const { left, top } = target();
        x = springStep(x, left, dt);
        y = springStep(y, top, dt);
        el.style.left = `${x.position}px`;
        el.style.top = `${y.position}px`;
        const atRest = Math.abs(x.position - left) < REST_DISTANCE &&
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
//# sourceMappingURL=glide.js.map