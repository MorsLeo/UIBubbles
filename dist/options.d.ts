import type { BubblesOptions, ResolvedBubblesOptions } from "./types/index.js";
/** Expanded panel width (px) when the consumer doesn't choose one. */
export declare const DEFAULT_PANEL_WIDTH = 480;
/** Applies every default; the theme stays a choice, resolved at paint time. */
export declare const resolveOptions: (options?: BubblesOptions) => ResolvedBubblesOptions;
/**
 * True when two resolved configurations paint and behave identically, so
 * configure() can skip the repaint. Props-driven consumers (framework
 * wrappers) call configure() on every render; this makes the unchanged
 * call free.
 */
export declare const sameOptions: (a: ResolvedBubblesOptions, b: ResolvedBubblesOptions) => boolean;
//# sourceMappingURL=options.d.ts.map