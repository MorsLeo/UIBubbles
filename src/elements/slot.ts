import type { BubbleSlot } from "$src/types";

/**
 * Resolves an icon/content slot to the element the bubble mounts, plus any
 * teardown to run when it leaves. A bare element passes straight through
 * (the consumer owns its lifecycle); a render callback gets a fresh host
 * element to populate and may return a cleanup — a framework `unmount`,
 * typically — that the manager calls on removal. `undefined` in, `{}` out,
 * so the caller's "no icon → default glyph" / "no content → no panel"
 * branches stay untouched.
 */
export const resolveSlot = (slot?: BubbleSlot): { el?: HTMLElement; teardown?: () => void } => {
	if (slot == null) return {};
	if (typeof slot !== "function") return { el: slot };

	const el = document.createElement("div");
	const teardown = slot(el);
	return { el, teardown: typeof teardown === "function" ? teardown : undefined };
};
