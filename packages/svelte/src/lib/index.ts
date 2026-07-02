export { default as Bubble } from "./Bubble.svelte";
export { default as Bubbles } from "./Bubbles.svelte";
export { getBubbles, type BubblesContext } from "./context";

// Core re-exports, so wrapper consumers rarely need the second import.
export { bubbleThemes } from "@hyperplexed/bubbles";
export type {
	BubbleManager,
	BubbleRemoveReason,
	BubbleSide,
	BubblesOptions,
	BubblesState,
	BubbleTheme,
	BubbleThemeName,
	PanelLength
} from "@hyperplexed/bubbles";
