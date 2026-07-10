import { createCaptureFollower } from "../behaviors/capture.js";
import { startFling } from "../behaviors/fling.js";
import { clearSnappedSide } from "../behaviors/snap.js";
import { createVelocityTracker } from "../behaviors/velocity.js";
import { TAP_DRAG_THRESHOLD } from "../constants.js";
import { RESTITUTION, TOUCH_VELOCITY_BOOST } from "../physics/config.js";
export const makeDraggable = (el, hooks = {}, dismissZone, 
// Read at fling time, so a reconfigured value applies to the next throw.
ricochet = () => RESTITUTION) => {
    const tracker = createVelocityTracker();
    let cancelFling;
    el.addEventListener("pointerdown", (event) => {
        // Secondary mouse buttons belong to the browser/host page context menu,
        // not bubble activation or drag.
        if (event.button !== 0)
            return;
        // preventDefault keeps the browser from starting text selection or
        // native drags. It also swallows click-to-focus — restored on tap
        // below, not here: focusing on pointerdown would ring every grab,
        // including a group drag or fling that opens nothing.
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
        let takenOver = false;
        const follower = dismissZone &&
            createCaptureFollower(el, dismissZone, () => ({
                left: lastX - offsetX,
                top: lastY - offsetY
            }));
        el.setPointerCapture(event.pointerId);
        // Nothing visual changes until the pointer leaves the tap dead zone,
        // so a slightly shaky tap doesn't nudge the bubble or unsnap it.
        // The grab offset is read here (not at pointerdown) because the
        // bubble may still be gliding under the pointer during the dead zone.
        const beginDrag = (e) => {
            dragging = true;
            const coarse = e.pointerType !== "mouse";
            takenOver = hooks.onDragStart?.(e.clientX, e.clientY, coarse) === true;
            clearSnappedSide(el);
            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            el.style.cursor = "grabbing";
            dismissZone?.show();
        };
        const onMove = (e) => {
            tracker.addSample(e.clientX, e.clientY, e.timeStamp);
            lastX = e.clientX;
            lastY = e.clientY;
            if (!dragging) {
                if (Math.hypot(e.clientX - startX, e.clientY - startY) < TAP_DRAG_THRESHOLD)
                    return;
                beginDrag(e);
            }
            // A taken-over drag owns every position; the drag just feeds it
            // the pointer and keeps the dismiss target's capture tracking.
            if (takenOver) {
                dismissZone?.track(e.clientX, e.clientY);
                hooks.onDragMove?.(e.clientX, e.clientY);
                return;
            }
            // Capture (and the escape back from it) wins over the pointer.
            if (follower?.update(e.clientX, e.clientY))
                return;
            el.style.left = `${e.clientX - offsetX}px`;
            el.style.top = `${e.clientY - offsetY}px`;
        };
        const onEnd = (e) => {
            el.style.cursor = "pointer";
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerup", onEnd);
            el.removeEventListener("pointercancel", onEnd);
            if (dragging) {
                if (dismissZone?.captured()) {
                    // Commit fires now, before the ride off-screen — consumers
                    // hear the dismissal the instant the user lets go.
                    hooks.onDismissCommit?.();
                    // The capture hold keeps running, so the bubble rides the
                    // target off-screen; removal waits until the pair is gone.
                    dismissZone.hide(() => {
                        follower?.cancel();
                        hooks.onDismiss?.();
                    });
                }
                else {
                    follower?.cancel();
                    dismissZone?.hide();
                    // Direct-contact pointers have no OS acceleration, so their
                    // raw px/s runs far below a mouse's; the boost levels the throw.
                    const boost = e.pointerType === "mouse" ? 1 : TOUCH_VELOCITY_BOOST;
                    const raw = tracker.getVelocity(e.timeStamp);
                    const velocity = { x: raw.x * boost, y: raw.y * boost };
                    if (!hooks.onDragEnd?.(velocity)) {
                        cancelFling = startFling(el, velocity, ricochet());
                    }
                }
            }
            else if (e.type === "pointerup") {
                // A tap, not a drag — stand click-to-focus back up (preventDefault
                // swallowed the native one). Only a tap focuses, so the bubble it
                // opens rings while a dragged group never does.
                el.focus({ preventScroll: true });
                hooks.onTap?.();
            }
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onEnd);
        el.addEventListener("pointercancel", onEnd);
    });
};
//# sourceMappingURL=drag.js.map