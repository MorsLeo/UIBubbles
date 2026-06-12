import type { BubbleSide, BubbleThemeName } from "$src/index";
import { type Component } from "svelte";

export interface PlaygroundConfig {
	theme: BubbleThemeName;
	/** Accent hex without the # (URL/snippet encoding); undefined keeps the preset's surfaces. */
	color: string | undefined;
	side: BubbleSide;
	vertical: number;
	panelWidth: number;
	/** AUTO_PANEL_MAX_HEIGHT means "no cap" — the slider's top end. */
	panelMaxHeight: number;
	maxBubbles: number;
}

/** A curated accent color in the controls panel. */
export interface Swatch {
	name: string;
	/** Hex without the #, matching the config encoding. */
	hex: string;
}

export interface Card {
	id: string;
	title: string;
	description: string;
	panel: Component;
	icon: Component<{ color?: string; size?: number }>;
}
