import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { createBubbleGroup } from "$src/behaviors/group";
import { MAX_BUBBLES } from "$src/constants";
import { createBubbleElement } from "$src/elements/bubble";
import { createPanel } from "$src/elements/panel";
import type { BubbleGroup, BubbleInstance, BubbleManager, DismissZone } from "$src/types";

export type { BubbleManager, BubbleOptions, BubbleSide } from "$src/types";

/**
 * Mounts the bubble overlay into the document and returns a manager
 * for adding and removing bubbles.
 */
export const createBubbles = (): BubbleManager => {
	const bubbles = new Map<string, BubbleInstance>();

	// One dismiss target and one group coordinate every bubble; created
	// lazily so constructing a manager touches no DOM.
	let zone: DismissZone | undefined;
	let group: BubbleGroup | undefined;

	const removeById = (id: string) => {
		const bubble = bubbles.get(id);
		if (!bubble) return;

		bubble.cleanup();
		bubble.el.remove();
		bubbles.delete(id);
		group?.removeMember(id);
	};

	const dismissById = (id: string) => {
		const bubble = bubbles.get(id);
		removeById(id);
		bubble?.onDismiss?.();
	};

	const onResize = () => group?.handleResize();

	const ensureGroup = (): BubbleGroup => {
		if (group) return group;

		zone = createDismissZone();
		group = createBubbleGroup(zone, {
			remove: dismissById,
			removeAll: () => {
				for (const id of [...bubbles.keys()]) dismissById(id);
			}
		});
		window.addEventListener("resize", onResize);
		return group;
	};

	return {
		add(options) {
			// Re-adding a bubble whose exit is in flight reverses the exit, so
			// rapid toggles always honor the latest direction; the original
			// element and panel live on, only the dismiss callback refreshes.
			const existing = bubbles.get(options.id);
			if (existing) {
				if (group?.restoreMember(options.id)) existing.onDismiss = options.onDismiss;
				return;
			}

			if (bubbles.size >= MAX_BUBBLES) return;
			const bubbleGroup = ensureGroup();

			const el = createBubbleElement(options.icon);
			const panel = options.content
				? createPanel(() => bubbleGroup.attachPoint(), el, options.content)
				: undefined;

			makeDraggable(
				el,
				{
					onTap: () => bubbleGroup.onTap(options.id),
					onDragStart: (x, y) => bubbleGroup.onDragStart(options.id, x, y),
					onDragMove: (x, y) => bubbleGroup.onDragMove(x, y),
					onDragEnd: (velocity) => bubbleGroup.onDragEnd(options.id, velocity),
					onDismiss: () => bubbleGroup.onDismiss(options.id)
				},
				zone
			);

			document.body.appendChild(el);
			bubbleGroup.addMember({ id: options.id, el, panel });

			bubbles.set(options.id, {
				el,
				onDismiss: options.onDismiss,
				cleanup: () => panel?.destroy()
			});
		},
		remove(id) {
			if (!bubbles.has(id)) return;

			// Programmatic removal animates the bubble off-screen first.
			if (group) group.retireMember(id, () => removeById(id));
			else removeById(id);
		},
		destroy() {
			for (const id of [...bubbles.keys()]) removeById(id);
			zone?.destroy();
			window.removeEventListener("resize", onResize);
		}
	};
};
