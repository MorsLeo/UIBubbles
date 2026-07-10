import { EDGE_MARGIN } from "../constants.js";
import { viewportHeight } from "../viewport.js";
/** Lowest top position that keeps the bottom edge gap. */
export const maxRestTop = (el) => viewportHeight() - el.offsetHeight - EDGE_MARGIN;
/** Clamps a top position so the bubble keeps the edge gap from the top and bottom of the viewport. */
export const clampTop = (el, top) => Math.min(Math.max(top, EDGE_MARGIN), maxRestTop(el));
//# sourceMappingURL=clamp.js.map