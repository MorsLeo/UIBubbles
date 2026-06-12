import { MAX_BUBBLES } from "$src/constants";
import { resolveTheme } from "$src/theme";
import type { BubblesOptions, ResolvedBubblesOptions } from "$src/types";

/** Expanded panel width (px) when the consumer doesn't choose one. */
export const DEFAULT_PANEL_WIDTH = 360;

/** Applies every default and flattens the theme choice to concrete tokens. */
export const resolveOptions = (options: BubblesOptions = {}): ResolvedBubblesOptions => ({
	theme: resolveTheme(options.theme, options.colors),
	side: options.side ?? "right",
	vertical: Math.min(Math.max(options.vertical ?? 0.5, 0), 1),
	panelWidth: options.panelWidth ?? DEFAULT_PANEL_WIDTH,
	panelMaxHeight: options.panelMaxHeight,
	maxBubbles: Math.max(1, options.maxBubbles ?? MAX_BUBBLES)
});
