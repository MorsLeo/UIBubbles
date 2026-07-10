import type { BubbleSide, GlideTarget, GroupMember, RowAnchor } from "../../types/index.js";
/** Where the element already is — the no-op glide target. */
export declare const restingPosition: (el: HTMLElement) => GlideTarget;
/** Half the stack's total vertical spread around its center. */
export declare const stackHalf: (count: number) => number;
/** Keeps the whole stack inside the vertical edge gaps. */
export declare const clampCenter: (center: number, el: HTMLElement, count: number) => number;
/** Docked slot: pure function of the group center, side, and member index. */
export declare const dockSlot: (member: GroupMember, stack: GroupMember[], centerY: number | undefined, side: BubbleSide) => GlideTarget;
/**
 * Row slot: the open bubbles sit in a row around the group's anchor —
 * top-centered until a drag teaches the group another spot. The anchor
 * is clamped at read time, so it survives resizes without going stale.
 */
export declare const rowSlot: (member: GroupMember, row: GroupMember[], anchor?: RowAnchor) => GlideTarget;
/** The row anchor a released member's landing implies: its slot lands exactly where it sits. */
export declare const rowFromLanding: (member: GroupMember, row: GroupMember[]) => RowAnchor;
/** The dock a landed member teaches the group: its side, and the stack center its slot implies. */
export declare const dockFromLanding: (member: GroupMember, stack: GroupMember[]) => {
    side: BubbleSide;
    centerY: number;
};
//# sourceMappingURL=layout.d.ts.map