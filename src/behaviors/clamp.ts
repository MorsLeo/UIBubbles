import { EDGE_MARGIN } from "$src/constants";

/** Lowest top position that keeps the bottom edge gap. */
export const maxRestTop = (el: HTMLElement): number =>
	window.innerHeight - el.offsetHeight - EDGE_MARGIN;

/** Clamps a top position so the bubble keeps the edge gap from the top and bottom of the viewport. */
export const clampTop = (el: HTMLElement, top: number): number =>
	Math.min(Math.max(top, EDGE_MARGIN), maxRestTop(el));
