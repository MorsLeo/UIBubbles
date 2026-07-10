import { clampTop } from "$src/behaviors/clamp";
import { chooseSide, getSnappedSide, sideRestLeft } from "$src/behaviors/snap";
import { EDGE_MARGIN, ROW_GAP, STACK_OFFSET } from "$src/constants";
import type { BubbleSide, GlideTarget, GroupMember, RowAnchor } from "$src/types";
import { viewportHeight, viewportWidth } from "$src/viewport";

/** Where the element already is — the no-op glide target. */
export const restingPosition = (el: HTMLElement): GlideTarget => {
	const rect = el.getBoundingClientRect();
	return { left: rect.left, top: rect.top };
};

/** Half the stack's total vertical spread around its center. */
export const stackHalf = (count: number): number => ((count - 1) * STACK_OFFSET) / 2;

/** Keeps the whole stack inside the vertical edge gaps. */
export const clampCenter = (center: number, el: HTMLElement, count: number): number => {
	const min = EDGE_MARGIN + el.offsetHeight / 2 + stackHalf(count);
	const max = viewportHeight() - EDGE_MARGIN - el.offsetHeight / 2 - stackHalf(count);
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

/** Total width of the open row for a given member size. */
const rowWidth = (memberWidth: number, count: number): number =>
	count * memberWidth + (count - 1) * ROW_GAP;

/** Keeps the whole row inside the horizontal edge gaps; an overflowing row centers. */
const clampRowCenter = (centerX: number, total: number): number => {
	const min = EDGE_MARGIN + total / 2;
	const max = viewportWidth() - EDGE_MARGIN - total / 2;
	if (min > max) return viewportWidth() / 2;
	return Math.min(Math.max(centerX, min), max);
};

/**
 * Row slot: the open bubbles sit in a row around the group's anchor —
 * top-centered until a drag teaches the group another spot. The anchor
 * is clamped at read time, so it survives resizes without going stale.
 */
export const rowSlot = (
	member: GroupMember,
	row: GroupMember[],
	anchor?: RowAnchor
): GlideTarget => {
	const index = row.findIndex((m) => m.id === member.id);
	if (index === -1) return restingPosition(member.el);

	const width = member.el.offsetWidth;
	const total = rowWidth(width, row.length);
	const centerX = clampRowCenter(anchor?.centerX ?? viewportWidth() / 2, total);
	return {
		left: centerX - total / 2 + index * (width + ROW_GAP),
		top: clampTop(member.el, anchor?.top ?? EDGE_MARGIN)
	};
};

/** The row anchor a released member's landing implies: its slot lands exactly where it sits. */
export const rowFromLanding = (member: GroupMember, row: GroupMember[]): RowAnchor => {
	const rect = member.el.getBoundingClientRect();
	const index = Math.max(
		row.findIndex((m) => m.id === member.id),
		0
	);
	const total = rowWidth(rect.width, row.length);
	return {
		centerX: rect.left - index * (rect.width + ROW_GAP) + total / 2,
		top: rect.top
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
