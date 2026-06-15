import type { PlaygroundConfig } from "$playground/types";
import {
	bubbleThemes,
	type BubblesOptions,
	type BubbleTheme,
	type BubbleThemeName
} from "$src/index";
import { MediaQuery } from "svelte/reactivity";

const channelToLinear = (channel: number): number => {
	const normalized = channel / 255;
	return normalized <= 0.03928
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex: string): number => {
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
};

const contrastRatio = (a: string, b: string): number => {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/**
 * White is the intended accent glyph treatment. Curated accents are dark
 * enough for it; very light custom colors swap to dark ink instead.
 */
export const contrastIcon = (hex: string): string => {
	const white = "ffffff";
	return contrastRatio(hex, white) >= 3 ? "#ffffff" : "#000000";
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
	initialState: config.initialState,
	side: config.side,
	vertical: config.vertical,
	panelWidth: config.panelWidth,
	panelMaxHeight: `${config.panelMaxHeight}%`,
	maxBubbles: config.maxBubbles
});
