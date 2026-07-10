import type { BubbleSide } from "../types/index.js";
export declare const getSnappedSide: (el: HTMLElement) => BubbleSide | undefined;
export declare const setSnappedSide: (el: HTMLElement, side: BubbleSide) => void;
export declare const clearSnappedSide: (el: HTMLElement) => void;
/** Which side the bubble should settle on, given where its center would coast to. */
export declare const chooseSide: (projectedCenterX: number) => BubbleSide;
/** Resting left position against a side, honoring the edge gap. */
export declare const sideRestLeft: (el: HTMLElement, side: BubbleSide) => number;
//# sourceMappingURL=snap.d.ts.map