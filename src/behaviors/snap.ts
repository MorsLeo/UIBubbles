import { EDGE_MARGIN } from "$src/constants";
import type { BubbleSide } from "$src/types";

export const getSnappedSide = (el: HTMLElement): BubbleSide | undefined =>
	el.dataset.bubbleSide as BubbleSide | undefined;

export const setSnappedSide = (el: HTMLElement, side: BubbleSide): void => {
	el.dataset.bubbleSide = side;
};

export const clearSnappedSide = (el: HTMLElement): void => {
	delete el.dataset.bubbleSide;
};

/** Which side the bubble should settle on, given where its center would coast to. */
export const chooseSide = (projectedCenterX: number): BubbleSide =>
	projectedCenterX < window.innerWidth / 2 ? "left" : "right";

/** Resting left position against a side, honoring the edge gap. */
export const sideRestLeft = (el: HTMLElement, side: BubbleSide): number =>
	side === "left" ? EDGE_MARGIN : window.innerWidth - el.offsetWidth - EDGE_MARGIN;
