import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { createBubbleGroup } from "$src/behaviors/group";
import { makeKeyInteractive } from "$src/behaviors/keyboard";
import { createBubbleElement } from "$src/elements/bubble";
import { createPanel } from "$src/elements/panel";
import { resolveOptions } from "$src/options";
import type {
	BubbleGroup,
	BubbleInstance,
	BubbleManager,
	BubblesOptions,
	DismissZone
} from "$src/types";

export { bubbleThemes } from "$src/theme";
export type {
	BubbleManager,
	BubbleOptions,
	BubbleSide,
	BubblesOptions,
	BubbleTheme,
	BubbleThemeName
} from "$src/types";

/**
 * Mounts the bubble overlay into the document and returns a manager
 * for adding and removing bubbles.
 */
export const createBubbles = (options?: BubblesOptions): BubbleManager => {
	const config = resolveOptions(options);
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

		zone = createDismissZone(config.theme);
		group = createBubbleGroup(
			zone,
			{
				remove: dismissById,
				removeAll: () => {
					for (const id of [...bubbles.keys()]) dismissById(id);
				}
			},
			{ side: config.side, vertical: config.vertical }
		);
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
				if (group?.restoreMember(options.id)) {
					existing.onDismiss = options.onDismiss;
					if (options.label) existing.el.setAttribute("aria-label", options.label);
				}
				return;
			}

			if (bubbles.size >= config.maxBubbles) return;
			const bubbleGroup = ensureGroup();

			// The bubble mounts before its panel so tab order flows bubble →
			// panel content (createPanel appends to the body itself).
			const el = createBubbleElement(config.theme, options.icon, options.label);
			document.body.appendChild(el);

			const panelId = `bubble-panel-${options.id}`;
			const panel = options.content
				? createPanel(() => bubbleGroup.attachPoint(), el, options.content, {
						id: panelId,
						label: options.label,
						theme: config.theme,
						width: config.panelWidth,
						maxHeight: config.panelMaxHeight,
						onEscape: () => bubbleGroup.onEscape()
					})
				: undefined;
			if (panel) el.setAttribute("aria-controls", panelId);

			makeDraggable(
				el,
				{
					onTap: () => bubbleGroup.onTap(options.id),
					onDragStart: (x, y, coarse) => bubbleGroup.onDragStart(options.id, x, y, coarse),
					onDragMove: (x, y) => bubbleGroup.onDragMove(x, y),
					onDragEnd: (velocity) => bubbleGroup.onDragEnd(options.id, velocity),
					onDismiss: () => bubbleGroup.onDismiss(options.id)
				},
				zone
			);
			makeKeyInteractive(el, {
				onActivate: () => bubbleGroup.onTap(options.id),
				onArrow: (direction, toEnd) => bubbleGroup.onArrow(options.id, direction, toEnd),
				onEscape: () => bubbleGroup.onEscape(),
				onDelete: () => bubbleGroup.onDelete(options.id)
			});

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
		toggle() {
			group?.toggle();
		},
		destroy() {
			for (const id of [...bubbles.keys()]) removeById(id);
			zone?.destroy();
			window.removeEventListener("resize", onResize);
		}
	};
};
