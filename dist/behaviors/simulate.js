import { MAX_FRAME_DT, MAX_STEP_DT } from "../physics/config.js";
/**
 * Drives a per-frame simulation step until it reports settling (returns
 * true). Each frame integrates its real elapsed time in substeps, so
 * low-frame-rate devices run at full speed instead of slow motion;
 * the whole-frame cap keeps a background-tab pause from integrating as
 * one giant leap. Steps receive dt in seconds. Returns a cancel function.
 */
export const runSimulation = (step) => {
    let lastTime;
    let frameId = 0;
    const frame = (now) => {
        let remaining = Math.min((now - (lastTime ?? now)) / 1000, MAX_FRAME_DT);
        lastTime = now;
        let settled = false;
        do {
            const dt = Math.min(remaining, MAX_STEP_DT);
            settled = step(dt);
            remaining -= dt;
        } while (!settled && remaining > 1e-6);
        if (!settled)
            frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
};
//# sourceMappingURL=simulate.js.map