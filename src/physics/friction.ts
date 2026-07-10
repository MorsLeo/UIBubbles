import { FRICTION } from "$src/physics/config";

/** Frame-rate-independent decay multiplier for a step of `dt` seconds. */
export const frictionDecay = (dt: number): number => Math.pow(FRICTION, dt);

/**
 * Total distance a velocity (px/s) coasts before friction stops it:
 * the integral of v·FRICTION^t from t = 0 to infinity.
 */
export const projectDistance = (velocity: number): number => -velocity / Math.log(FRICTION);
