import { makeDraggable } from "$src/behaviors/drag";
import { watchWindowResize } from "$src/behaviors/resize";
import { createBubbleElement } from "$src/elements/bubble";
import type { BubbleInstance, BubbleManager } from "$src/types";

export type { BubbleManager, BubbleOptions, BubbleSide } from "$src/types";

/**
 * Mounts the bubble overlay into the document and returns a manager
 * for adding and removing bubbles.
 */
export const createBubbles = (): BubbleManager => {
	const bubbles = new Map<string, BubbleInstance>();

	const dispose = (bubble: BubbleInstance) => {
		bubble.unwatch();
		bubble.el.remove();
	};

	return {
		add(options) {
			const el = createBubbleElement();
			makeDraggable(el);
			document.body.appendChild(el);
			bubbles.set(options.id, { el, unwatch: watchWindowResize(el) });
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
