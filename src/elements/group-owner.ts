import { visuallyHidden } from "$src/elements/visually-hidden";

/** Hidden element that groups the bubbles in the accessibility tree. */
export interface GroupOwner {
	/**
	 * Reparents the given bubble element ids under the group via aria-owns and
	 * names the group by its size — no DOM move, so the bubbles' position,
	 * z-order, and drag logic are untouched; only the a11y tree reparents them.
	 */
	sync(elementIds: string[]): void;
	destroy(): void;
}

export const createGroupOwner = (): GroupOwner => {
	const el = document.createElement("div");
	el.setAttribute("role", "group");
	Object.assign(el.style, visuallyHidden);
	document.body.appendChild(el);

	return {
		sync(elementIds) {
			el.setAttribute("aria-owns", elementIds.join(" "));
			const n = elementIds.length;
			el.setAttribute("aria-label", `${n} bubble${n === 1 ? "" : "s"}`);
		},
		destroy() {
			el.remove();
		}
	};
};
