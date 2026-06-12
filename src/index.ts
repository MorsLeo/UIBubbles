import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { createBubbleGroup } from "$src/behaviors/group";
import { makeKeyInteractive } from "$src/behaviors/keyboard";
import { createBubbleElement, setBubbleTheme } from "$src/elements/bubble";
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
	BubblesState,
	BubbleTheme,
	BubbleThemeName
} from "$src/types";

/**
 * Mounts the bubble overlay into the document and returns a manager
 * for adding and removing bubbles.
 */
export const createBubbles = (options?: BubblesOptions): BubbleManager => {
	let config = resolveOptions(options);
	const bubbles = new Map<string, BubbleInstance>();

	// Ids whose exit animation is in flight. They stay registered so a
	// re-add can reverse the exit, but they're leaving — so they no
	// longer hold a capacity slot, and an evict-then-add swap works in
	// one tick.
	const retiring = new Set<string>();

	const panelAppearance = () => ({
		theme: config.theme,
		width: config.panelWidth,
		maxHeight: config.panelMaxHeight
	});

	// One dismiss target and one group coordinate every bubble; created
	// lazily so constructing a manager touches no DOM.
	let zone: DismissZone | undefined;
	let group: BubbleGroup | undefined;

	// An emptied-out overlay tears down completely, so the next bubble
	// enters like the first one did — fresh dock from the current config.
	const teardownGroup = () => {
		if (!zone) return;
		group = undefined;
		zone.destroy();
		zone = undefined;
		window.removeEventListener("resize", onResize);
	};

	const removeById = (id: string) => {
		const bubble = bubbles.get(id);
		if (!bubble) return;

		bubble.panel?.destroy();
		bubble.el.remove();
		bubbles.delete(id);
		retiring.delete(id);
		group?.removeMember(id);
		if (bubbles.size === 0) teardownGroup();
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
			{ side: config.side, vertical: config.vertical, initialState: config.initialState }
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
					retiring.delete(options.id);
					existing.onDismiss = options.onDismiss;
					if (options.label) existing.el.setAttribute("aria-label", options.label);
				}
				return true;
			}

			if (bubbles.size - retiring.size >= config.maxBubbles) return false;
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
						appearance: panelAppearance(),
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
				panel,
				onDismiss: options.onDismiss
			});
			return true;
		},
		remove(id) {
			if (!bubbles.has(id)) return;

			// Programmatic removal animates the bubble off-screen first.
			if (group) {
				retiring.add(id);
				group.retireMember(id, () => removeById(id));
			} else removeById(id);
		},
		configure(options) {
			config = resolveOptions(options);

			// Everything the library painted repaints in place; consumer
			// icons and content are the consumer's to restyle.
			zone?.setTheme(config.theme);
			for (const bubble of bubbles.values()) {
				setBubbleTheme(bubble.el, config.theme);
				bubble.panel?.setAppearance(panelAppearance());
			}
		},
		toggle() {
			group?.toggle();
		},
		state() {
			return group?.state() ?? config.initialState;
		},
		destroy() {
			for (const id of [...bubbles.keys()]) removeById(id);
			// Covers the never-added case; removeById tears down otherwise.
			teardownGroup();
		}
	};
};
