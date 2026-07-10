/** Gap between a resting bubble and any screen edge. */
export declare const EDGE_MARGIN = 12;
/** Pointer travel (px) below which a press counts as a tap, not a drag. */
export declare const TAP_DRAG_THRESHOLD = 5;
/** Default cap on bubbles per manager (the `maxBubbles` option overrides it). */
export declare const MAX_BUBBLES = 5;
/** Vertical offset (px) between bubbles stacked in the docked group. */
export declare const STACK_OFFSET = 16;
/** Horizontal gap (px) between bubbles in the open row at the top. */
export declare const ROW_GAP = 12;
/**
 * Z-layers, top down: bubbles (stack-topmost highest, descending by
 * member index), then the panel.
 */
export declare const Z_BUBBLE_TOP = 2147483647;
export declare const Z_PANEL = 2147483600;
//# sourceMappingURL=constants.d.ts.map