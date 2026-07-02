import { setBubbleHover, setBubblePressed } from "$src/elements/bubble";
import type { GroupFeedback, GroupMember } from "$src/types";

/**
 * Group-wide hover/press visuals. Docked, the stack reads as one
 * control: hovering or pressing any member scales every member
 * together. `enabled` gates the wiring so open-row bubbles keep their
 * individual hover states.
 */
export const createGroupFeedback = (
	members: GroupMember[],
	enabled: () => boolean
): GroupFeedback => {
	const setHover = (hovered: boolean) => {
		for (const m of members) setBubbleHover(m.el, hovered);
	};

	const setPressed = (pressed: boolean) => {
		for (const m of members) setBubblePressed(m.el, pressed);
	};

	const attach = (el: HTMLElement) => {
		const whenEnabled = (apply: () => void) => () => {
			if (enabled()) apply();
		};
		const hoverOn = whenEnabled(() => setHover(true));
		const hoverOff = whenEnabled(() => setHover(false));
		const press = whenEnabled(() => setPressed(true));
		const release = whenEnabled(() => setPressed(false));

		el.addEventListener("pointerenter", hoverOn);
		el.addEventListener("pointerleave", hoverOff);
		el.addEventListener("pointerdown", press);
		el.addEventListener("pointerup", release);
		el.addEventListener("pointercancel", release);
	};

	return { setHover, setPressed, attach };
};
