import { activeRestLeft, isActive } from "$src/behaviors/activate";
import { clampTop } from "$src/behaviors/clamp";
import { getSnappedSide } from "$src/behaviors/snap";
import { EDGE_MARGIN } from "$src/constants";

/**
 * Keeps a resting bubble anchored as the window resizes: an active
 * bubble stays at top center (its panel follows on its own), a snapped
 * one stays pinned to its edge, and both stay inside the vertical
 * bounds. Returns a cleanup function that removes the listener.
 */
export const watchWindowResize = (el: HTMLElement): (() => void) => {
	const onResize = () => {
		if (isActive(el)) {
			el.style.left = `${activeRestLeft(el)}px`;
			el.style.top = `${EDGE_MARGIN}px`;
			return;
		}

		el.style.top = `${clampTop(el, el.getBoundingClientRect().top)}px`;

		// Only a right-snapped bubble needs horizontal repositioning — a
		// left-snapped bubble's left offset is unaffected by width changes.
		if (getSnappedSide(el) !== "right") return;
		el.style.left = `${window.innerWidth - el.offsetWidth - EDGE_MARGIN}px`;
	};

	window.addEventListener("resize", onResize);
	return () => window.removeEventListener("resize", onResize);
};
