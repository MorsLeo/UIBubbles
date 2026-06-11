import { MAX_FRAME_DT } from "$src/physics/config";

/**
 * Drives a per-frame simulation step until it reports settling (returns
 * true). Steps receive dt in seconds, clamped so a background-tab pause
 * doesn't explode the integration. Returns a cancel function.
 */
export const runSimulation = (step: (dt: number) => boolean): (() => void) => {
	let lastTime: number | undefined;
	let frameId = 0;

	const frame = (now: number) => {
		const dt = Math.min((now - (lastTime ?? now)) / 1000, MAX_FRAME_DT);
		lastTime = now;
		if (!step(dt)) frameId = requestAnimationFrame(frame);
	};

	frameId = requestAnimationFrame(frame);
	return () => cancelAnimationFrame(frameId);
};
