/** Frame-rate-independent decay multiplier for a step of `dt` seconds. */
export declare const frictionDecay: (dt: number) => number;
/**
 * Total distance a velocity (px/s) coasts before friction stops it:
 * the integral of v·FRICTION^t from t = 0 to infinity.
 */
export declare const projectDistance: (velocity: number) => number;
//# sourceMappingURL=friction.d.ts.map