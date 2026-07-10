import type { BubbleTheme, BubbleThemeName } from "./types/index.js";
/**
 * Preset color schemes, named for the host page they suit. Exported so
 * consumers can read a preset's tokens when building overrides.
 */
export declare const bubbleThemes: Record<BubbleThemeName, BubbleTheme>;
/** A preset with per-token overrides folded in. */
export declare const resolveTheme: (name: BubbleThemeName, overrides?: Partial<BubbleTheme>) => BubbleTheme;
/** The preset matching the browser's color-scheme preference right now. */
export declare const systemThemeName: () => BubbleThemeName;
//# sourceMappingURL=theme.d.ts.map