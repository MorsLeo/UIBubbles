/** Gap between a resting bubble and any screen edge. */
export const EDGE_MARGIN = 12;

/** Pointer travel (px) below which a press counts as a tap, not a drag. */
export const TAP_DRAG_THRESHOLD = 5;

/** Pointer distance (px) from the dismiss target's center that captures the bubble — the desktop ceiling; small screens scale it down. */
export const DISMISS_CAPTURE_RADIUS = 160;

/** Pointer distance (px) within which the dismiss target leans toward the cursor — the desktop ceiling; small screens scale it down. */
export const DISMISS_ATTRACT_RADIUS = 600;

/** Most bubbles a manager will hold; add() ignores requests beyond it. */
export const MAX_BUBBLES = 5;

/** Vertical offset (px) between bubbles stacked in the docked group. */
export const STACK_OFFSET = 16;

/** Horizontal gap (px) between bubbles in the open row at the top. */
export const ROW_GAP = 12;

/**
 * Z-layers, top down: bubbles (stack-topmost highest, descending by
 * member index), then the dismiss target, then the panel.
 */
export const Z_BUBBLE_TOP = 2147483647;
export const Z_DISMISS_TARGET = 2147483610;
export const Z_PANEL = 2147483600;
