import { createActivation } from "$src/behaviors/activate";
import { makeDraggable } from "$src/behaviors/drag";
import { watchWindowResize } from "$src/behaviors/resize";
import { setSnappedSide, sideRestLeft } from "$src/behaviors/snap";
import { createBubbleElement } from "$src/elements/bubble";
import { createPanel } from "$src/elements/panel";
import type { BubbleInstance, BubbleManager } from "$src/types";

export type { BubbleManager, BubbleOptions, BubbleSide } from "$src/types";

/**
 * Mounts the bubble overlay into the document and returns a manager
 * for adding and removing bubbles.
 */
export const createBubbles = (): BubbleManager => {
	const bubbles = new Map<string, BubbleInstance>();

	const dispose = (bubble: BubbleInstance) => {
		bubble.cleanup();
		bubble.el.remove();
	};

	return {
		add(options) {
			const el = createBubbleElement();

			// Panel first, bubble after: same z-index, so DOM order keeps the
			// bubble painting above the panel.
			const panel = options.content ? createPanel(el, options.content) : undefined;

			const activation = createActivation(el, panel);

			makeDraggable(el, {
				onTap: activation.toggle,
				onDragStart: activation.onDragStart,
				onDragEnd: activation.onDragEnd
			});

			document.body.appendChild(el);

			// Bubbles are born docked to an edge — a side-relative position is
			// the only kind that survives window resizes and zoom changes.
			el.style.left = `${sideRestLeft(el, "right")}px`;
			el.style.top = `${(window.innerHeight - el.offsetHeight) / 2}px`;
			setSnappedSide(el, "right");

			const unwatchResize = watchWindowResize(el);
			bubbles.set(options.id, {
				el,
				cleanup: () => {
					unwatchResize();
					activation.interrupt();
					panel?.destroy();
				}
			});
		},
		remove(id) {
			const bubble = bubbles.get(id);
			if (bubble) dispose(bubble);
			bubbles.delete(id);
		},
		destroy() {
			for (const bubble of bubbles.values()) dispose(bubble);
			bubbles.clear();
		}
	};
};
