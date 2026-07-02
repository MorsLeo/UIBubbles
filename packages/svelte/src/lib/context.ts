import type { BubbleManager, BubblesState } from "@hyperplexed/bubbles";
import { getContext, setContext } from "svelte";

/** What `<Bubbles>` shares with everything rendered beneath it. */
export interface BubblesContext {
	/** The underlying manager — the full imperative API when you need it. */
	readonly manager: BubbleManager;
	/** Reactive mirror of `manager.state()`. */
	readonly state: BubblesState;
	/** Reactive mirror of `manager.active()`. */
	readonly active: string | undefined;
}

// Symbol.for so two loaded copies of the wrapper (a dedupe failure)
// still share one context slot.
const KEY = Symbol.for("@hyperplexed/bubbles-svelte");

/** Registers a `<Bubbles>` instance for its subtree — internal to the wrapper. */
export const setBubblesContext = (context: BubblesContext): BubblesContext =>
	setContext(KEY, context);

/**
 * The nearest `<Bubbles>` ancestor's manager and reactive state. Call it
 * during component init, like any `getContext`.
 */
export const getBubbles = (): BubblesContext => {
	const context = getContext<BubblesContext | undefined>(KEY);
	if (!context) throw new Error("getBubbles() and <Bubble> require a <Bubbles> ancestor");
	return context;
};
