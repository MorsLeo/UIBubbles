import { EDGE_MARGIN } from "../constants.js";
import { viewportWidth } from "../viewport.js";
export const getSnappedSide = (el) => el.dataset.bubbleSide;
export const setSnappedSide = (el, side) => {
    el.dataset.bubbleSide = side;
};
export const clearSnappedSide = (el) => {
    delete el.dataset.bubbleSide;
};
/** Which side the bubble should settle on, given where its center would coast to. */
export const chooseSide = (projectedCenterX) => projectedCenterX < viewportWidth() / 2 ? "left" : "right";
/** Resting left position against a side, honoring the edge gap. */
export const sideRestLeft = (el, side) => side === "left" ? EDGE_MARGIN : viewportWidth() - el.offsetWidth - EDGE_MARGIN;
//# sourceMappingURL=snap.js.map