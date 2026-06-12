import { MAX_BUBBLES } from "$src/constants";
import { RESTITUTION } from "$src/physics/config";
import type { BubblesOptions, ResolvedBubblesOptions } from "$src/types";

/** Expanded panel width (px) when the consumer doesn't choose one. */
export const DEFAULT_PANEL_WIDTH = 480;

/** Applies every default; the theme stays a choice, resolved at paint time. */
export const resolveOptions = (options: BubblesOptions = {}): ResolvedBubblesOptions => ({
	theme: options.theme ?? "auto",
	colors: options.colors,
	side: options.side ?? "right",
	vertical: Math.min(Math.max(options.vertical ?? 0.5, 0), 1),
	panelWidth: options.panelWidth ?? DEFAULT_PANEL_WIDTH,
	panelMaxHeight: options.panelMaxHeight,
	maxBubbles: Math.max(1, options.maxBubbles ?? MAX_BUBBLES),
	ricochet: Math.min(Math.max(options.ricochet ?? RESTITUTION, 0), 1),
	initialState: options.initialState ?? "docked"
});
