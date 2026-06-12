import { AUTO_PANEL_MAX_HEIGHT } from "$playground/defaults";
import type { PlaygroundConfig } from "$playground/types";
import { bubbleThemes, type BubblesOptions, type BubbleTheme } from "$src/index";

/**
 * Black or white, whichever reads against the accent — so white and
 * black themselves work as accents. The threshold leans white: saturated
 * hues like amber sit mid-luminance and look better with white ink.
 */
export const contrastIcon = (hex: string): string => {
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.7 ? "#000000" : "#ffffff";
};

/** The accent recolors the bubble surfaces; the glyph takes the contrasting ink. */
export const accentColors = (hex: string): Partial<BubbleTheme> => ({
	bubbleSurface: `#${hex}`,
	focusRing: `#${hex}`,
	bubbleIcon: contrastIcon(hex)
});

/** The glyph ink for the configured bubble surface — accent or the preset's. */
export const glyphInk = (config: PlaygroundConfig): string =>
	contrastIcon(config.color ?? bubbleThemes[config.theme].bubbleSurface.slice(1));

export const toBubblesOptions = (config: PlaygroundConfig): BubblesOptions => ({
	theme: config.theme,
	colors: config.color ? accentColors(config.color) : undefined,
	side: config.side,
	vertical: config.vertical,
	panelWidth: config.panelWidth,
	panelMaxHeight:
		config.panelMaxHeight === AUTO_PANEL_MAX_HEIGHT ? undefined : config.panelMaxHeight,
	maxBubbles: config.maxBubbles,
	// The demo always opens up top — presentation, not a user knob, so
	// the snippet doesn't include it.
	initialState: "open"
});
