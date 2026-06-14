import type { PlaygroundConfig } from "$playground/types";

/** Slider ceiling that means "no panel height cap". */
export const AUTO_PANEL_MAX_HEIGHT = 720;

/** Slider bounds, shared by the controls and the URL param clamping. */
export const ranges = {
	vertical: { min: 0, max: 1, step: 0.05 },
	// The top end exceeds any common viewport; the library clamps the
	// panel inside the screen margins, so max reads as "full width".
	panelWidth: { min: 280, max: 1600, step: 20 },
	panelMaxHeight: { min: 240, max: AUTO_PANEL_MAX_HEIGHT, step: 40 },
	maxBubbles: { min: 1, max: 5 }
} as const;

/**
 * Mirrors the library defaults so the URL and snippet can omit matching
 * values — except initialState, which the demo flips to "open" (the
 * library defaults to "docked") to show the flock up top. The snippet
 * compares that one against the library default, not this, so it stays
 * runnable.
 */
export const defaults: PlaygroundConfig = {
	theme: "auto",
	color: undefined,
	initialState: "open",
	side: "right",
	vertical: 0.5,
	panelWidth: 480,
	panelMaxHeight: AUTO_PANEL_MAX_HEIGHT,
	maxBubbles: 5
};
