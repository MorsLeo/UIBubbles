import { startGlide } from "$src/behaviors/glide";
import { runSimulation } from "$src/behaviors/simulate";
import type { CaptureFollower, DismissZone, GlideTarget } from "$src/types";

/** Half-life (s) of the bubble's catch-up gap after the dismiss target captures it. */
const CAPTURE_SETTLE_HALF_LIFE = 0.07;

/**
 * Owns the bubble's position around the dismiss target: while captured
 * it rides the target's center 1:1 (so their rates always match) plus a
 * catch-up gap that decays away — an absolute spring would lag behind
 * the directly-driven target. On escape it springs the bubble back to
 * the live pointer position, then hands control back to the drag.
 */
export const createCaptureFollower = (
	el: HTMLElement,
	zone: DismissZone,
	pointerTarget: () => GlideTarget
): CaptureFollower => {
	let cancelHold: (() => void) | undefined;
	let cancelEscape: (() => void) | undefined;

	const startHold = () => {
		const rect = el.getBoundingClientRect();
		const grabbed = zone.center();
		let gapX = rect.left + rect.width / 2 - grabbed.x;
		let gapY = rect.top + rect.height / 2 - grabbed.y;

		return runSimulation((dt) => {
			const decay = Math.pow(0.5, dt / CAPTURE_SETTLE_HALF_LIFE);
			gapX *= decay;
			gapY *= decay;

			const c = zone.center();
			el.style.left = `${c.x + gapX - el.offsetWidth / 2}px`;
			el.style.top = `${c.y + gapY - el.offsetHeight / 2}px`;
			return false; // Runs until escape or release cancels it.
		});
	};

	return {
		update(x, y) {
			if (zone.track(x, y)) {
				cancelEscape?.();
				cancelEscape = undefined;
				cancelHold ??= startHold();
				return true;
			}

			if (cancelHold) {
				cancelHold();
				cancelHold = undefined;
				cancelEscape = startGlide(el, pointerTarget, {
					onRest: () => {
						cancelEscape = undefined;
					}
				});
			}
			return cancelEscape !== undefined;
		},
		cancel() {
			cancelHold?.();
			cancelHold = undefined;
			cancelEscape?.();
			cancelEscape = undefined;
		}
	};
};
