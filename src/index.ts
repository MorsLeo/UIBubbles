import { createActivation } from "$src/behaviors/activate";
import { clampTop } from "$src/behaviors/clamp";
import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { startFling } from "$src/behaviors/fling";
import { watchWindowResize } from "$src/behaviors/resize";
import { EDGE_MARGIN } from "$src/constants";
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

	const removeById = (id: string) => {
		const bubble = bubbles.get(id);
		if (bubble) dispose(bubble);
		bubbles.delete(id);
	};

	return {
		add(options) {
			const el = createBubbleElement();

			// Panel first, bubble after: same z-index, so DOM order keeps the
			// bubble painting above the panel.
			const panel = options.content ? createPanel(el, options.content) : undefined;

			const activation = createActivation(el, panel);

			// The entrance fling isn't owned by drag, so first interaction has
			// to cancel it here — otherwise two simulations fight over position.
			let cancelEntrance: (() => void) | undefined;
			const clearEntrance = () => {
				cancelEntrance?.();
				cancelEntrance = undefined;
			};

			const dismissZone = createDismissZone();

			makeDraggable(
				el,
				{
					onTap: () => {
						clearEntrance();
						activation.toggle();
					},
					onDragStart: () => {
						clearEntrance();
						activation.onDragStart();
					},
					onDragEnd: activation.onDragEnd,
					onDismiss: () => {
						removeById(options.id);
						options.onDismiss?.();
					}
				},
				dismissZone
			);

			document.body.appendChild(el);

			// Born just off-screen at dock height, then flung in with zero
			// velocity: the standard physics carry it to the right-side rest
			// (and stamp the snapped side, so resize/zoom anchoring holds).
			el.style.left = `${window.innerWidth + EDGE_MARGIN}px`;
			el.style.top = `${clampTop(el, (window.innerHeight - el.offsetHeight) / 2)}px`;
			cancelEntrance = startFling(el, { x: 0, y: 0 });

			const unwatchResize = watchWindowResize(el);
			bubbles.set(options.id, {
				el,
				cleanup: () => {
					clearEntrance();
					unwatchResize();
					activation.interrupt();
					panel?.destroy();
					dismissZone.destroy();
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
