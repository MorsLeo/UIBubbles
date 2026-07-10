import type { PanelLength } from "./types/index.js";
/**
 * Runtime guard for a panel dimension: a finite, non-negative number (px),
 * or a `"<n>px"` / `"<n>%"` string. The PanelLength type covers callers
 * who reach the API through TypeScript; this covers values arriving from
 * untyped JavaScript.
 */
export declare const isPanelLength: (value: unknown) => value is PanelLength;
/**
 * Validates a panel dimension at the API boundary, naming the offending
 * option. A bad value fails loudly at the call instead of silently
 * dropping out of a CSS declaration a paint later. `undefined` passes —
 * every sizing option is optional.
 */
export declare const assertPanelLength: (value: PanelLength | undefined, option: string) => void;
/** Formats a validated panel dimension as a CSS length; a bare number is px. */
export declare const toCssLength: (value: PanelLength) => string;
//# sourceMappingURL=panel-length.d.ts.map