import { clampTop } from "$src/behaviors/clamp";
import { getSnappedSide } from "$src/behaviors/snap";
import { EDGE_MARGIN } from "$src/constants";

/**
 * Keeps a snapped bubble pinned to its edge and inside the vertical
 * bounds as the window resizes. Returns a cleanup function that
 * removes the listener.
 */
export const watchWindowResize = (el: HTMLElement): (() => void) => {
	const onResize = () => {
		el.style.top = `${clampTop(el, el.getBoundingClientRect().top)}px`;

		// Only a right-snapped bubble needs horizontal repositioning — a
		// left-snapped bubble's left offset is unaffected by width changes.
		if (getSnappedSide(el) !== "right") return;
		el.style.left = `${window.innerWidth - el.offsetWidth - EDGE_MARGIN}px`;
	};

	window.addEventListener("resize", onResize);
	return () => window.removeEventListener("resize", onResize);
};
