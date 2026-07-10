import type { Velocity } from "../types/index.js";
/**
 * Simulates the bubble from release until it rests against a wall.
 *
 * Horizontal: a damped spring toward the wall chosen by projecting the
 * release velocity, so it always lands on an edge and arrives as hot as
 * it was thrown. Vertical: pure inertia with ricochet off the top/bottom
 * gap — which is what makes an angled throw hit the wall and slide
 * along it. `restitution` is the fraction of speed surviving each
 * bounce (0 = dead stop, 1 = lossless).
 *
 * Returns a cancel function (grabbing a bubble mid-flight). `onRest`
 * fires only on natural arrival.
 */
export declare const startFling: (el: HTMLElement, releaseVelocity: Velocity, restitution: number, onRest?: () => void) => (() => void);
//# sourceMappingURL=fling.d.ts.map