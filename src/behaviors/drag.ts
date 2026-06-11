import { clearSnappedSide, snapToEdge } from "$src/behaviors/snap";

export const makeDraggable = (el: HTMLElement): void => {
	el.addEventListener("pointerdown", (event) => {
		event.preventDefault();
		clearSnappedSide(el);

		// Read the rect before cancelling animations so grabbing a mid-snap
		// bubble freezes it at its current visual position instead of jumping.
		const rect = el.getBoundingClientRect();
		const offsetX = event.clientX - rect.left;
		const offsetY = event.clientY - rect.top;
		Object.assign(el.style, {
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			transform: "none",
			cursor: "grabbing"
		});
		for (const animation of el.getAnimations()) animation.cancel();

		el.setPointerCapture(event.pointerId);

		const onMove = (e: PointerEvent) => {
			el.style.left = `${e.clientX - offsetX}px`;
			el.style.top = `${e.clientY - offsetY}px`;
		};
		const onEnd = () => {
			el.style.cursor = "pointer";
			el.removeEventListener("pointermove", onMove);
			el.removeEventListener("pointerup", onEnd);
			el.removeEventListener("pointercancel", onEnd);
			snapToEdge(el);
		};

		el.addEventListener("pointermove", onMove);
		el.addEventListener("pointerup", onEnd);
		el.addEventListener("pointercancel", onEnd);
	});
};
