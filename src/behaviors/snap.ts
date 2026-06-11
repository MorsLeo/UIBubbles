import { clampTop } from "$src/behaviors/clamp";
import { EDGE_MARGIN } from "$src/constants";
import type { BubbleSide } from "$src/types";

const SNAP_DURATION_MS = 600;
/** Fast launch, long decelerating tail. */
const SNAP_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

export const getSnappedSide = (el: HTMLElement): BubbleSide | undefined =>
	el.dataset.bubbleSide as BubbleSide | undefined;

export const clearSnappedSide = (el: HTMLElement): void => {
	delete el.dataset.bubbleSide;
};

export const snapToEdge = (el: HTMLElement): void => {
	const rect = el.getBoundingClientRect();
	const centerX = rect.left + rect.width / 2;
	const side: BubbleSide = centerX < window.innerWidth / 2 ? "left" : "right";
	const targetLeft = side === "left" ? EDGE_MARGIN : window.innerWidth - rect.width - EDGE_MARGIN;
	const targetTop = clampTop(el, rect.top);

	el.dataset.bubbleSide = side;

	// Set the final position immediately; the animation visually overlays it,
	// so when it finishes (or is cancelled) the style already holds the target.
	el.style.left = `${targetLeft}px`;
	el.style.top = `${targetTop}px`;
	el.animate(
		[
			{ left: `${rect.left}px`, top: `${rect.top}px` },
			{ left: `${targetLeft}px`, top: `${targetTop}px` }
		],
		{
			duration: SNAP_DURATION_MS,
			easing: SNAP_EASING
		}
	);
};
