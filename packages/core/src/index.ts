import { createDismissZone } from "$src/behaviors/dismiss";
import { makeDraggable } from "$src/behaviors/drag";
import { createBubbleGroup } from "$src/behaviors/group";
import { makeKeyInteractive } from "$src/behaviors/keyboard";
import { createBubbleElement, setBubbleTheme } from "$src/elements/bubble";
import { createLiveRegion } from "$src/elements/live-region";
import { createPanel } from "$src/elements/panel";
import { resolveSlot } from "$src/elements/slot";
import { resolveOptions, sameOptions } from "$src/options";
import { assertPanelLength } from "$src/panel-length";
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
	BubbleSlot,
	BubblesOptions,
	BubblesState,
	BubbleTheme,
	BubbleThemeName,
	PanelLength
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
			// Add/dismiss are announced at their call sites (while the bubble
			// still exists to read a label from); expand/collapse is a pure
			// state diff, announced here with the live item count.
			const count = bubbles.size - retiring.size;
			if (state === "open")
				live.announce(`Bubbles expanded, ${count} ${count === 1 ? "item" : "items"}`);
			else if (count > 0) live.announce("Bubbles collapsed");
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

	// --- Accessibility: live announcements and focus return ---

	const live = createLiveRegion();
	const labelFor = (id: string) => bubbles.get(id)?.el.getAttribute("aria-label") ?? "Bubble";

	// The last element focused outside the flock, so when the flock empties
	// (the final row bubble deleted) focus returns there instead of stranding
	// on <body>; a registered trigger is the fallback.
	let returnFocusEl: HTMLElement | null = null;
	const isInFlock = (node: Node | null): boolean =>
		node !== null &&
		[...bubbles.values()].some((b) => b.el.contains(node) || b.panel?.contains(node) === true);
	const onFocusIn = (event: FocusEvent) => {
		if (!isInFlock(event.target as Node | null)) returnFocusEl = event.target as HTMLElement | null;
	};
	const restoreFocus = () => {
		for (const candidate of [returnFocusEl, ...triggers]) {
			if (candidate?.isConnected) {
				candidate.focus();
				if (document.activeElement === candidate) return;
			}
		}
	};

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
		document.removeEventListener("pointerdown", onDocumentPointerDown, true);
		document.removeEventListener("focusin", onFocusIn);
		scheme?.removeEventListener("change", onSchemeChange);
		scheme = undefined;
	};

	const removeById = (id: string, reason: BubbleRemoveReason) => {
		const bubble = bubbles.get(id);
		if (!bubble) return;

		bubble.panel?.destroy();
		bubble.el.remove();
		// Mirror the documented manual teardown order — library DOM goes, then
		// the consumer's render-callback cleanup (a framework unmount of the
		// now-detached icon/content) runs.
		for (const teardown of bubble.teardowns ?? []) teardown();
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

	// Consumer-registered openers — buttons outside the flock that expand or
	// switch bubbles (the demo's cards). A press on one is the trigger doing
	// its job, not a tap-away, so it's exempt from the collapse below. Lives
	// on the manager, not the group: triggers outlive an emptied flock.
	const triggers = new Set<HTMLElement>();

	// Tap-away to collapse, Android-style. Capture phase so a host page that
	// stops propagation can't suppress it; pointerdown so it fires on press,
	// not release. Purely a signal — the group never consumes the event, so
	// the click still reaches whatever the user pressed (the panel is
	// non-modal). Lives only while the overlay does.
	const onDocumentPointerDown = (event: PointerEvent) => {
		const node = event.target instanceof Node ? event.target : null;
		for (const trigger of triggers) if (trigger.contains(node)) return;
		group?.onOutsidePointer(event.target);
	};

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
					// Announced here, at commit, while the bubble is still mounted —
					// by flush time the user-removal has already deleted it.
					live.announce(`${labelFor(id)} dismissed`);
					occurrences.push({ event: "dismiss", detail: { id } });
					scheduleFlush();
				},
				onChange: scheduleFlush,
				restoreFocus
			},
			{
				side: config.side,
				vertical: config.vertical,
				initialState: config.initialState,
				ricochet: () => config.ricochet
			}
		);
		window.addEventListener("resize", onResize);
		document.addEventListener("pointerdown", onDocumentPointerDown, true);
		document.addEventListener("focusin", onFocusIn);

		// Seed the return target with focus that predates the listener: a flock
		// opened over an already-focused control (the listener attaches here, on
		// the first add) still hands focus back when it empties.
		const preexisting = document.activeElement;
		if (preexisting instanceof HTMLElement && preexisting !== document.body && !isInFlock(preexisting))
			returnFocusEl = preexisting;

		scheme = window.matchMedia("(prefers-color-scheme: dark)");
		scheme.addEventListener("change", onSchemeChange);
		return group;
	};

	return {
		add(options) {
			// Validate sizing up front so a bad override fails at the call,
			// for both the reuse and the fresh-mount paths below.
			assertPanelLength(options.panelWidth, "panelWidth");
			assertPanelLength(options.panelMaxHeight, "panelMaxHeight");

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

			// A slot is a ready element or a render callback; resolve each to an
			// element plus an optional teardown the manager runs on removal.
			const icon = resolveSlot(options.icon);
			const content = resolveSlot(options.content);
			const teardowns = [icon.teardown, content.teardown].filter(
				(teardown): teardown is () => void => teardown !== undefined
			);

			// The bubble mounts before its panel so tab order flows bubble →
			// panel content (createPanel appends to the body itself).
			const el = createBubbleElement(themeTokens(), icon.el, options.label);
			document.body.appendChild(el);

			const panelId = `bubble-panel-${options.id}`;
			const panel = content.el
				? createPanel(() => bubbleGroup.attachPoint(), el, content.el, {
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
				onDismiss: options.onDismiss,
				teardowns
			});
			live.announce(`${labelFor(options.id)} added`);
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
			const next = resolveOptions(options);
			// A configuration that resolves to what's already applied is a
			// no-op — so consumers that mirror props (framework wrappers)
			// can call this unconditionally.
			if (sameOptions(config, next)) return;
			config = next;
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
		registerTrigger(el) {
			triggers.add(el);
			return () => triggers.delete(el);
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
			live.destroy();
		}
	};
};
