import type { BubbleGroup, BubbleSide, BubblesState, DismissZone, GroupCallbacks } from "../../types/index.js";
/**
 * Coordinates every bubble. Docked, they're a stack distributed around
 * a group-owned center: they drag together as a chained trail, fling
 * together, and dismiss together. Tapped open, they form a centered row
 * at the top with one member's panel showing — tap to switch panels,
 * tap the active bubble to collapse home. Row bubbles drag (and
 * dismiss) individually, returning to their slot on release.
 */
export declare const createBubbleGroup: (zone: DismissZone, callbacks: GroupCallbacks, config: {
    side: BubbleSide;
    vertical: number;
    initialState: BubblesState;
    /** Read at each fling, so configure() retunes it live. */
    ricochet: () => number;
}) => BubbleGroup;
//# sourceMappingURL=index.d.ts.map