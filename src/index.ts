import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { createBubbleGroup } from "$src/behaviors/group";
import { makeKeyInteractive } from "$src/behaviors/keyboard";
import { createBubbleElement, setBubbleTheme } from "$src/elements/bubble";
import { createPanel } from "$src/elements/panel";
import { resolveOptions } from "$src/options";
import { resolveTheme, systemThemeName } from "$src/theme";
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

	// "auto" reads the OS preference at paint time; the scheme listener
	// below repaints when it flips, so the overlay tracks it live.
	const themeTokens = () =>
		resolveTheme(config.theme === "auto" ? systemThemeName() : config.theme, config.colors);

	// Per-bubble sizing overrides win over the manager's values, and
	// being absolute they survive configure() repaints unchanged.
	const panelAppearance = (overrides: Pick<BubbleInstance, "panelWidth" | "panelMaxHeight">) => ({
		theme: themeTokens(),
		width: overrides.panelWidth ?? config.panelWidth,
		maxHeight: overrides.panelMaxHeight ?? config.panelMaxHeight
	});

	// Everything the library painted repaints in place; consumer icons
	// and content are the consumer's to restyle. Nothing evaluates while
	// no bubbles exist, so it's safe without a DOM.
	const repaint = () => {
		zone?.setTheme(themeTokens());
		for (const bubble of bubbles.values()) {
			setBubbleTheme(bubble.el, themeTokens());
			bubble.panel?.setAppearance(panelAppearance(bubble));
		}
	};

	// One dismiss target and one group coordinate every bubble; created
	// lazily so constructing a manager touches no DOM.
	let zone: DismissZone | undefined;
	let group: BubbleGroup | undefined;

	// Repaints an auto-themed overlay when the OS preference flips;
	// registered only while the overlay exists.
	let scheme: MediaQueryList | undefined;
	const onSchemeChange = () => {
		if (config.theme === "auto") repaint();
	};

	// An emptied-out overlay tears down completely, so the next bubble
	// enters like the first one did — fresh dock from the current config.
	const teardownGroup = () => {
		if (!zone) return;
		group = undefined;
		zone.destroy();
		zone = undefined;
		window.removeEventListener("resize", onResize);
		scheme?.removeEventListener("change", onSchemeChange);
		scheme = undefined;
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

		zone = createDismissZone(themeTokens());
		group = createBubbleGroup(
			zone,
			{
				remove: dismissById,
				removeAll: () => {
					for (const id of [...bubbles.keys()]) dismissById(id);
				}
			},
			{
				side: config.side,
				vertical: config.vertical,
				initialState: config.initialState,
				ricochet: () => config.ricochet
			}
		);
		window.addEventListener("resize", onResize);
		scheme = window.matchMedia("(prefers-color-scheme: dark)");
		scheme.addEventListener("change", onSchemeChange);
		return group;
	};

	return {
		add(options) {
			// Re-adding a mounted bubble refreshes everything refreshable in
			// place — the dismiss callback, the label, the panel sizing
			// overrides — and reverses an exit still in flight, so rapid
			// toggles always honor the latest direction. The element, icon,
			// and content live on.
			const existing = bubbles.get(options.id);
			if (existing) {
				if (group?.restoreMember(options.id)) retiring.delete(options.id);
				existing.onDismiss = options.onDismiss;
				existing.panelWidth = options.panelWidth;
				existing.panelMaxHeight = options.panelMaxHeight;
				existing.panel?.setAppearance(panelAppearance(existing));
				if (options.label) existing.el.setAttribute("aria-label", options.label);
				return true;
			}

			if (bubbles.size - retiring.size >= config.maxBubbles) return false;
			const bubbleGroup = ensureGroup();

			// The bubble mounts before its panel so tab order flows bubble →
			// panel content (createPanel appends to the body itself).
			const el = createBubbleElement(themeTokens(), options.icon, options.label);
			document.body.appendChild(el);

			const panelId = `bubble-panel-${options.id}`;
			const panel = options.content
				? createPanel(() => bubbleGroup.attachPoint(), el, options.content, {
						id: panelId,
						label: options.label,
						appearance: panelAppearance(options),
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
				zone,
				() => config.ricochet
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
				panelWidth: options.panelWidth,
				panelMaxHeight: options.panelMaxHeight,
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
			repaint();
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
