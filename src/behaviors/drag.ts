import { createCaptureFollower } from "$src/behaviors/capture";
import { startFling } from "$src/behaviors/fling";
import { clearSnappedSide } from "$src/behaviors/snap";
import { createVelocityTracker } from "$src/behaviors/velocity";
import { TAP_DRAG_THRESHOLD } from "$src/constants";
import type { DismissZone, DragHooks } from "$src/types";

export const makeDraggable = (
	el: HTMLElement,
	hooks: DragHooks = {},
	dismissZone?: DismissZone
): void => {
	const tracker = createVelocityTracker();
	let cancelFling: (() => void) | undefined;

	el.addEventListener("pointerdown", (event) => {
		event.preventDefault();

		// Cancelling an in-flight fling freezes the bubble where it was
		// grabbed — the simulation has already written its current position.
		cancelFling?.();
		cancelFling = undefined;

		tracker.reset();
		tracker.addSample(event.clientX, event.clientY, event.timeStamp);

		const startX = event.clientX;
		const startY = event.clientY;
		let offsetX = 0;
		let offsetY = 0;
		let lastX = event.clientX;
		let lastY = event.clientY;
		let dragging = false;

		const follower =
			dismissZone &&
			createCaptureFollower(el, dismissZone, () => ({
				left: lastX - offsetX,
				top: lastY - offsetY
			}));

		el.setPointerCapture(event.pointerId);

		// Nothing visual changes until the pointer leaves the tap dead zone,
		// so a slightly shaky tap doesn't nudge the bubble or unsnap it.
		// The grab offset is read here (not at pointerdown) because the
		// bubble may still be gliding under the pointer during the dead zone.
		const beginDrag = (e: PointerEvent) => {
			dragging = true;
			hooks.onDragStart?.();
			clearSnappedSide(el);

			const rect = el.getBoundingClientRect();
			offsetX = e.clientX - rect.left;
			offsetY = e.clientY - rect.top;

			el.style.cursor = "grabbing";
			dismissZone?.show();
		};

		const onMove = (e: PointerEvent) => {
			tracker.addSample(e.clientX, e.clientY, e.timeStamp);
			lastX = e.clientX;
			lastY = e.clientY;

			if (!dragging) {
				if (Math.hypot(e.clientX - startX, e.clientY - startY) < TAP_DRAG_THRESHOLD) return;
				beginDrag(e);
			}

			// Capture (and the escape back from it) wins over the pointer.
			if (follower?.update(e.clientX, e.clientY)) return;

			el.style.left = `${e.clientX - offsetX}px`;
			el.style.top = `${e.clientY - offsetY}px`;
		};

		const onEnd = (e: PointerEvent) => {
			el.style.cursor = "pointer";

			el.removeEventListener("pointermove", onMove);
			el.removeEventListener("pointerup", onEnd);
			el.removeEventListener("pointercancel", onEnd);

			if (dragging) {
				if (dismissZone?.captured()) {
					// The capture hold keeps running, so the bubble rides the
					// target off-screen; removal waits until the pair is gone.
					dismissZone.hide(() => {
						follower?.cancel();
						hooks.onDismiss?.();
					});
				} else {
					follower?.cancel();
					dismissZone?.hide();

					const velocity = tracker.getVelocity(e.timeStamp);
					if (!hooks.onDragEnd?.(velocity)) {
						cancelFling = startFling(el, velocity);
					}
				}
			} else if (e.type === "pointerup") {
				hooks.onTap?.();
			}
		};

		el.addEventListener("pointermove", onMove);
		el.addEventListener("pointerup", onEnd);
		el.addEventListener("pointercancel", onEnd);
	});
};
