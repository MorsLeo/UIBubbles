import { FRICTION } from "../physics/config.js";
/** Frame-rate-independent decay multiplier for a step of `dt` seconds. */
export const frictionDecay = (dt) => Math.pow(FRICTION, dt);
/**
 * Total distance a velocity (px/s) coasts before friction stops it:
 * the integral of v·FRICTION^t from t = 0 to infinity.
 */
export const projectDistance = (velocity) => -velocity / Math.log(FRICTION);
//# sourceMappingURL=friction.js.map