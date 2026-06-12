import { AUTO_PANEL_MAX_HEIGHT } from "$playground/defaults";
import type { PlaygroundConfig } from "$playground/types";
import {
	bubbleThemes,
	type BubblesOptions,
	type BubbleTheme,
	type BubbleThemeName
} from "$src/index";
import { MediaQuery } from "svelte/reactivity";

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

// The visitor's OS preference, tracked reactively so "auto" consumers
// (page chrome, glyph ink) repaint when it flips.
const prefersDark = new MediaQuery("(prefers-color-scheme: dark)");

/** The preset actually painting right now — "auto" resolves via the OS. */
export const effectiveTheme = (config: PlaygroundConfig): BubbleThemeName =>
	config.theme === "auto" ? (prefersDark.current ? "dark" : "light") : config.theme;

/** The glyph ink for the configured bubble surface — accent or the preset's. */
export const glyphInk = (config: PlaygroundConfig): string =>
	contrastIcon(config.color ?? bubbleThemes[effectiveTheme(config)].bubbleSurface.slice(1));

export const toBubblesOptions = (config: PlaygroundConfig): BubblesOptions => ({
	theme: config.theme,
	colors: config.color ? accentColors(config.color) : undefined,
	side: config.side,
	vertical: config.vertical,
	panelWidth: config.panelWidth,
	panelMaxHeight:
		config.panelMaxHeight === AUTO_PANEL_MAX_HEIGHT ? undefined : config.panelMaxHeight,
	maxBubbles: config.maxBubbles
});
