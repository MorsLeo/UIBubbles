import { visuallyHidden } from "$src/elements/visually-hidden";

/** A polite ARIA live region for status announcements. */
export interface LiveRegion {
	/** Speaks a message to assistive tech politely — never interrupting. */
	announce(message: string): void;
	destroy(): void;
}

/**
 * Two polite regions, announced into alternately. Re-setting a node to the
 * same text it already holds is dropped by some screen reader/browser combos
 * (two unlabelled adds both say "Bubble added"), so each message lands in a
 * freshly-cleared region — an unambiguous change even when it repeats. Exactly
 * one node holds text at a time, so the pair's combined text is always just the
 * latest message. Created lazily, kept until destroy() so a message fired as
 * the overlay tears down (the last bubble leaving) still has somewhere to read.
 */
export const createLiveRegion = (): LiveRegion => {
	let nodes: [HTMLElement, HTMLElement] | undefined;
	let active: 0 | 1 = 0;

	const ensure = (): [HTMLElement, HTMLElement] => {
		if (nodes) return nodes;
		const make = () => {
			const el = document.createElement("div");
			el.setAttribute("aria-live", "polite");
			el.setAttribute("aria-atomic", "true");
			Object.assign(el.style, visuallyHidden);
			return document.body.appendChild(el);
		};
		nodes = [make(), make()];
		return nodes;
	};

	return {
		announce(message) {
			const pair = ensure();
			pair[active].textContent = "";
			active = active === 0 ? 1 : 0;
			pair[active].textContent = message;
		},
		destroy() {
			nodes?.forEach((node) => node.remove());
			nodes = undefined;
		}
	};
};
