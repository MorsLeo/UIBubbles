<script lang="ts">
	import Bubble from "../lib/Bubble.svelte";
	import Bubbles from "../lib/Bubbles.svelte";

	interface Props {
		label?: string;
		note?: string;
		showBubble?: boolean;
		showSecond?: boolean;
		maxBubbles?: number;
		onRejected?: () => void;
	}

	let {
		label = "Chat",
		note = "hello",
		showBubble = true,
		showSecond = false,
		maxBubbles = 5,
		onRejected
	}: Props = $props();
</script>

<Bubbles {maxBubbles}>
	{#if showBubble}
		<Bubble id="chat" {label}>
			{#snippet icon()}<span data-testid="icon">C</span>{/snippet}
			<p data-testid="note">{note}</p>
		</Bubble>
	{/if}
	{#if showSecond}
		<Bubble id="extra" label="Extra" {onRejected} />
	{/if}
</Bubbles>
