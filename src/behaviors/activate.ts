import { clampTop } from "$src/behaviors/clamp";
import { startGlide } from "$src/behaviors/glide";
import {
	chooseSide,
	clearSnappedSide,
	getSnappedSide,
	setSnappedSide,
	sideRestLeft
} from "$src/behaviors/snap";
import { EDGE_MARGIN } from "$src/constants";
import type { ActivationController, BubbleSide, PanelController } from "$src/types";

export const isActive = (el: HTMLElement): boolean => el.dataset.bubbleActive === "true";

/** How close (px) the bubble must be to the active spot before the panel appears. */
const PANEL_APPEAR_DISTANCE = 100;

/** Horizontal center of the viewport — the active bubble's resting left. */
export const activeRestLeft = (el: HTMLElement): number => (window.innerWidth - el.offsetWidth) / 2;

/**
 * Tap toggles the bubble between its docked wall spot and the active
 * spot at top center. The docked spot is remembered on activation and
 * restored on the way back. The panel (if any) follows the active
 * state: shown when the bubble settles at top center, hidden the
 * moment it leaves.
 */
export const createActivation = (
	el: HTMLElement,
	panel?: PanelController
): ActivationController => {
	let restSide: BubbleSide | undefined;
	let restTop = EDGE_MARGIN;
	let cancelGlide: (() => void) | undefined;

	const activeTarget = () => ({ left: activeRestLeft(el), top: EDGE_MARGIN });

	// Mid-flight, once the bubble nears the active spot, the panel fades
	// in (and follows the bubble on its own from there).
	const revealPanelWhenNear = () => {
		if (!panel) return;
		const target = activeTarget();
		const rect = el.getBoundingClientRect();
		if (Math.hypot(rect.left - target.left, rect.top - target.top) < PANEL_APPEAR_DISTANCE) {
			panel.show();
		}
	};

	const glideToActive = () => {
		cancelGlide?.();
		cancelGlide = startGlide(el, activeTarget, { onFrame: revealPanelWhenNear });
	};

	const activate = () => {
		const snappedSide = getSnappedSide(el);
		if (snappedSide) {
			restSide = snappedSide;
			restTop = el.getBoundingClientRect().top;
		} else if (restSide === undefined) {
			// First-ever activation from an undocked bubble (caught mid-fling).
			const rect = el.getBoundingClientRect();
			restSide = chooseSide(rect.left + rect.width / 2);
			restTop = clampTop(el, rect.top);
		}
		// (Caught mid-return otherwise: keep the remembered docked spot
		// instead of overwriting it with a position in flight.)

		el.dataset.bubbleActive = "true";
		clearSnappedSide(el);
		glideToActive();
	};

	const deactivate = () => {
		const side = restSide ?? "right";
		const top = restTop;

		delete el.dataset.bubbleActive;
		panel?.hide();

		cancelGlide?.();
		cancelGlide = startGlide(el, () => ({ left: sideRestLeft(el, side), top: clampTop(el, top) }), {
			onRest: () => setSnappedSide(el, side)
		});
	};

	return {
		toggle() {
			if (isActive(el)) deactivate();
			else activate();
		},
		onDragStart() {
			cancelGlide?.();
			cancelGlide = undefined;
			panel?.hide();
		},
		onDragEnd() {
			// An active bubble can be dragged around but not thrown: release
			// returns it to top center, still active (Android behavior). The
			// remembered docked spot survives for the eventual deactivate.
			if (!isActive(el)) return false;
			glideToActive();
			return true;
		},
		interrupt() {
			cancelGlide?.();
			cancelGlide = undefined;
			delete el.dataset.bubbleActive;
			panel?.hide();
		}
	};
};
