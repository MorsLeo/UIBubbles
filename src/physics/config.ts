/**
 * All feel tunables in one place. These constants ARE the personality
 * of the throw — tune them in the playground.
 */

/** Fraction of coasting velocity remaining after one second. */
export const FRICTION = 0.02;

/** Spring pull toward the wall (1/s²). */
export const SPRING_STIFFNESS = 170;

/** Spring resistance (1/s). Critical damping is 2·√stiffness ≈ 26 — below that overshoots slightly. */
export const SPRING_DAMPING = 20;

/** Below this speed (px/s) an axis counts as at rest. */
export const REST_VELOCITY = 10;

/** Within this distance (px) of the target counts as arrived. */
export const REST_DISTANCE = 0.5;

/**
 * Cap on a single simulation step (s). Kept near one real frame so a
 * main-thread stall (panel mounts, tab switches) never integrates as a
 * single giant step — a visible teleport. After a stall, motion just
 * resumes smoothly from where it was.
 */
export const MAX_FRAME_DT = 0.02;

/** Max distance (px) a thrown bubble may dip past the screen edge before the wall stops it. */
export const MAX_EDGE_DIP = 20;

/** Fraction of speed surviving a top/bottom impact (0 = dead stop, 1 = lossless bounce). */
export const RESTITUTION = 0.4;
