import type { GlideHooks, GlideTarget } from "../types/index.js";
/**
 * Spring-glides the element to a point. The target is a function so it
 * tracks viewport changes mid-flight (zoom, resize). Returns a cancel
 * function.
 */
export declare const startGlide: (el: HTMLElement, target: () => GlideTarget, hooks?: GlideHooks) => (() => void);
//# sourceMappingURL=glide.d.ts.map