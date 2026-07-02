<script lang="ts">
	import { createBubbles, type BubblesOptions, type BubblesState } from "@hyperplexed/bubbles";
	import { onDestroy, untrack, type Snippet } from "svelte";
	import { setBubblesContext } from "./context";

	interface Props extends BubblesOptions {
		children?: Snippet;
		/** Mirrors the manager's `statechange` event. */
		onStateChange?: (state: BubblesState) => void;
		/** Mirrors the manager's `activechange` event. */
		onActiveChange?: (id: string | undefined) => void;
	}

	let { children, onStateChange, onActiveChange, ...options }: Props = $props();

	// Constructing a manager touches no DOM, so this is server-safe; bubbles
	// only mount when <Bubble> children add() themselves in effects, which
	// never run on the server. Deliberately the initial options — the
	// configure() effect below tracks every later change.
	const manager = createBubbles(untrack(() => ({ ...options })));

	// Not named `state`: a variable of that name makes `$state` read as a
	// store subscription to svelte-check.
	let flockState = $state(manager.state());
	let activeId = $state(manager.active());

	const unsubscribes = [
		manager.on("statechange", (detail) => {
			flockState = detail.state;
			onStateChange?.(detail.state);
		}),
		manager.on("activechange", (detail) => {
			activeId = detail.id;
			onActiveChange?.(detail.id);
		})
	];

	setBubblesContext({
		manager,
		get state() {
			return flockState;
		},
		get active() {
			return activeId;
		}
	});

	// Props are the whole configuration: the spread reads every option so
	// any change reruns this, and configure() bails when the result is
	// identical — the first run (and echo runs) cost nothing.
	$effect(() => {
		manager.configure({ ...options });
	});

	onDestroy(() => {
		for (const unsubscribe of unsubscribes) unsubscribe();
		manager.destroy();
	});
</script>

{@render children?.()}
