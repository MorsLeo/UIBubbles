import type { CaptureFollower, DismissZone, GlideTarget } from "../types/index.js";
/**
 * Owns the bubble's position around the dismiss target: while captured
 * it rides the target's center 1:1 (so their rates always match) plus a
 * catch-up gap that decays away — an absolute spring would lag behind
 * the directly-driven target. On escape it springs the bubble back to
 * the live pointer position, then hands control back to the drag.
 */
export declare const createCaptureFollower: (el: HTMLElement, zone: DismissZone, pointerTarget: () => GlideTarget) => CaptureFollower;
//# sourceMappingURL=capture.d.ts.map