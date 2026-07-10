import type { BubbleGroup, BubbleSide, BubblesState, GroupCallbacks } from "../../types/index.js";
/**
 * Coordinates every bubble. Docked, they're a stack distributed around
 * a group-owned center: they drag together as a chained trail and fling
 * together. Tapped open, they form a row — top-centered at first — with
 * one member's panel showing: tap to switch panels, tap the active
 * bubble to collapse home. Dragging a row bubble moves the row: its
 * landing becomes the row's new anchor, and the rest of the flock (and
 * the panel) reflows around it.
 */
export declare const createBubbleGroup: (callbacks: GroupCallbacks, config: {
    side: BubbleSide;
    vertical: number;
    initialState: BubblesState;
    /** Read at each fling, so configure() retunes it live. */
    ricochet: () => number;
}) => BubbleGroup;
//# sourceMappingURL=index.d.ts.map