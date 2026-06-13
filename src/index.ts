import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { createBubbleGroup } from "$src/behaviors/group";
import { makeKeyInteractive } from "$src/behaviors/keyboard";
import { createBubbleElement, setBubbleTheme } from "$src/elements/bubble";
import { createPanel } from "$src/elements/panel";
import { resolveOptions } from "$src/options";
import { resolveTheme, systemThemeName } from "$src/theme";
import type {
	BubbleEvents,
	BubbleGroup,
	BubbleInstance,
	BubbleManager,
	BubbleRemoveReason,
	BubblesOptions,
	BubblesState,
	DismissZone
} from "$src/types";

export { bubbleThemes } from "$src/theme";
export type {
	BubbleEvents,
	BubbleManager,
	BubbleOptions,
	BubbleRemoveReason,
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

	// Event delivery is deferred to a microtask: handlers always observe
	// a settled manager (never a half-mutated group), and a handler that
	// mutates in response re-enters cleanly instead of corrupting the
	// choreography that emitted. add/remove are occurrences and queue in
	// order; statechange/activechange are diffed against the last
	// delivered value at flush time, so a flicker that lands back where
	// it started (a re-add reversing a removal, an emptying flock
	// passing through "docked") coalesces to nothing.
	const listeners = new Map<keyof BubbleEvents, Set<(detail: never) => void>>();
	const occurrences: Array<
		| { event: "add"; detail: BubbleEvents["add"] }
		| { event: "dismiss"; detail: BubbleEvents["dismiss"] }
		| { event: "remove"; detail: BubbleEvents["remove"] }
	> = [];
	let lastState: BubblesState = config.initialState;
	let lastActive: string | undefined;
	let flushQueued = false;

	const currentState = (): BubblesState => group?.state() ?? config.initialState;

	const deliver = <E extends keyof BubbleEvents>(event: E, detail: BubbleEvents[E]) => {
		const handlers = listeners.get(event);
		if (!handlers) return;
		// Copied so a handler (un)subscribing mid-delivery can't skip or
		// double-call its neighbors.
		for (const handler of [...handlers]) handler(detail as never);
	};

	const flush = () => {
		flushQueued = false;
		for (const { event, detail } of occurrences.splice(0)) deliver(event, detail);

		const state = currentState();
		if (state !== lastState) {
			lastState = state;
			deliver("statechange", { state });
		}
		const active = group?.active();
		if (active !== lastActive) {
			lastActive = active;
			deliver("activechange", { id: active });
		}
	};

	const scheduleFlush = () => {
		if (flushQueued) return;
		flushQueued = true;
		queueMicrotask(flush);
	};

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

	const removeById = (id: string, reason: BubbleRemoveReason) => {
		const bubble = bubbles.get(id);
		if (!bubble) return;

		bubble.panel?.destroy();
		bubble.el.remove();
		bubbles.delete(id);
		retiring.delete(id);
		group?.removeMember(id);
		if (bubbles.size === 0) teardownGroup();
		occurrences.push({ event: "remove", detail: { id, reason } });
		scheduleFlush();
	};

	const dismissById = (id: string) => {
		const bubble = bubbles.get(id);
		removeById(id, "user");
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
				},
				// Commit-time announcement: the bubble is still mounted (its
				// exit hasn't started), and a remove with reason "user" follows
				// once it's gone.
				dismissed: (id) => {
					if (!bubbles.has(id)) return;
					occurrences.push({ event: "dismiss", detail: { id } });
					scheduleFlush();
				},
				onChange: scheduleFlush
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
					onDismissCommit: () => bubbleGroup.onDismissCommit(options.id),
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
			occurrences.push({ event: "add", detail: { id: options.id } });
			scheduleFlush();
			return true;
		},
		remove(id) {
			if (!bubbles.has(id)) return;

			// Programmatic removal animates the bubble off-screen first.
			if (group) {
				retiring.add(id);
				group.retireMember(id, () => removeById(id, "programmatic"));
			} else removeById(id, "programmatic");
		},
		configure(options) {
			config = resolveOptions(options);
			repaint();
			// While empty, state() reads the configured initialState — a
			// changed one is a state change like any other.
			scheduleFlush();
		},
		toggle() {
			group?.toggle();
		},
		state: currentState,
		active: () => group?.active(),
		activate(id) {
			group?.activate(id);
		},
		on(event, handler) {
			let handlers = listeners.get(event);
			if (!handlers) {
				handlers = new Set();
				listeners.set(event, handlers);
			}
			handlers.add(handler);
			return () => {
				handlers.delete(handler);
			};
		},
		destroy() {
			for (const id of [...bubbles.keys()]) removeById(id, "programmatic");
			// Covers the never-added case; removeById tears down otherwise.
			teardownGroup();
		}
	};
};
