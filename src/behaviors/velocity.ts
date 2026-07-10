import type { Velocity, VelocityTracker } from "$src/types";

/** Only samples this recent count toward the release velocity. */
const SAMPLE_WINDOW_MS = 100;

interface Sample {
	x: number;
	y: number;
	time: number;
}

export const createVelocityTracker = (): VelocityTracker => {
	let samples: Sample[] = [];

	return {
		addSample(x, y, time) {
			samples.push({ x, y, time });
			samples = samples.filter((s) => time - s.time <= SAMPLE_WINDOW_MS);
		},
		getVelocity(now) {
			// A drag that pauses before release stops producing samples, so the
			// stale ones age out of the window and the velocity reads as zero.
			const recent = samples.filter((s) => now - s.time <= SAMPLE_WINDOW_MS);
			const first = recent[0];
			const last = recent[recent.length - 1];
			if (!first || !last || last.time === first.time) return { x: 0, y: 0 };

			const seconds = (last.time - first.time) / 1000;
			return {
				x: (last.x - first.x) / seconds,
				y: (last.y - first.y) / seconds
			};
		},
		reset() {
			samples = [];
		}
	};
};
