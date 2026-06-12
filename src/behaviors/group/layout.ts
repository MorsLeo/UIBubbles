import { chooseSide, getSnappedSide, sideRestLeft } from "$src/behaviors/snap";
import { EDGE_MARGIN, ROW_GAP, STACK_OFFSET } from "$src/constants";
import type { BubbleSide, GlideTarget, GroupMember } from "$src/types";

/** Where the element already is — the no-op glide target. */
export const restingPosition = (el: HTMLElement): GlideTarget => {
	const rect = el.getBoundingClientRect();
	return { left: rect.left, top: rect.top };
};

/** Half the stack's total vertical spread around its center. */
export const stackHalf = (count: number): number => ((count - 1) * STACK_OFFSET) / 2;

/** Keeps the whole stack inside the vertical edge gaps. */
const clampCenter = (center: number, el: HTMLElement, count: number) => {
	const min = EDGE_MARGIN + el.offsetHeight / 2 + stackHalf(count);
	const max = window.innerHeight - EDGE_MARGIN - el.offsetHeight / 2 - stackHalf(count);
	return Math.min(Math.max(center, min), max);
};

/** Docked slot: pure function of the group center, side, and member index. */
export const dockSlot = (
	member: GroupMember,
	stack: GroupMember[],
	centerY: number | undefined,
	side: BubbleSide
): GlideTarget => {
	const el = member.el;
	const index = stack.findIndex((m) => m.id === member.id);
	if (centerY === undefined || index === -1) return restingPosition(el);

	const center = clampCenter(centerY, el, stack.length);
	const top = center - el.offsetHeight / 2 - stackHalf(stack.length) + index * STACK_OFFSET;
	return { left: sideRestLeft(el, side), top };
};

/** Row slot: the open bubbles sit centered in a row along the top gap. */
export const rowSlot = (member: GroupMember, row: GroupMember[]): GlideTarget => {
	const index = row.findIndex((m) => m.id === member.id);
	if (index === -1) return restingPosition(member.el);

	const width = member.el.offsetWidth;
	const total = row.length * width + (row.length - 1) * ROW_GAP;
	return {
		left: (window.innerWidth - total) / 2 + index * (width + ROW_GAP),
		top: EDGE_MARGIN
	};
};

/** The dock a landed member teaches the group: its side, and the stack center its slot implies. */
export const dockFromLanding = (
	member: GroupMember,
	stack: GroupMember[]
): { side: BubbleSide; centerY: number } => {
	const rect = member.el.getBoundingClientRect();
	const index = stack.findIndex((m) => m.id === member.id);
	return {
		side: getSnappedSide(member.el) ?? chooseSide(rect.left + rect.width / 2),
		centerY: rect.top + rect.height / 2 + stackHalf(stack.length) - index * STACK_OFFSET
	};
};
