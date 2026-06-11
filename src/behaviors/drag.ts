import { startFling } from "$src/behaviors/fling";
import { clearSnappedSide } from "$src/behaviors/snap";
import { createVelocityTracker } from "$src/behaviors/velocity";

export const makeDraggable = (el: HTMLElement): void => {
	const tracker = createVelocityTracker();
	let cancelFling: (() => void) | undefined;

	el.addEventListener("pointerdown", (event) => {
		event.preventDefault();

		// Stop an in-flight fling first; the simulation writes its position
		// every frame, so the rect read below freezes it where it was grabbed.
		cancelFling?.();
		cancelFling = undefined;
		clearSnappedSide(el);
		tracker.reset();
		tracker.addSample(event.clientX, event.clientY, event.timeStamp);

		// Switch from centered positioning to explicit pixel coordinates.
		const rect = el.getBoundingClientRect();
		const offsetX = event.clientX - rect.left;
		const offsetY = event.clientY - rect.top;
		Object.assign(el.style, {
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			transform: "none",
			cursor: "grabbing"
		});

		el.setPointerCapture(event.pointerId);

		const onMove = (e: PointerEvent) => {
			tracker.addSample(e.clientX, e.clientY, e.timeStamp);
			el.style.left = `${e.clientX - offsetX}px`;
			el.style.top = `${e.clientY - offsetY}px`;
		};
		const onEnd = (e: PointerEvent) => {
			el.style.cursor = "pointer";
			el.removeEventListener("pointermove", onMove);
			el.removeEventListener("pointerup", onEnd);
			el.removeEventListener("pointercancel", onEnd);
			cancelFling = startFling(el, tracker.getVelocity(e.timeStamp));
		};

		el.addEventListener("pointermove", onMove);
		el.addEventListener("pointerup", onEnd);
		el.addEventListener("pointercancel", onEnd);
	});
};
