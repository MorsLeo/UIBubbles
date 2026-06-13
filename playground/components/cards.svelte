<script lang="ts">
	import { cards } from "$playground/cards";
	import type { Card } from "$playground/types";

	const {
		open,
		registerTrigger
	}: {
		open: (card: Card) => void;
		registerTrigger: (el: HTMLElement) => () => void;
	} = $props();

	// The cards open and switch bubbles, so a press on one is a trigger,
	// not a tap-away — registering the row keeps the press from collapsing
	// the flock a beat before open() reopens it.
	const trigger = (node: HTMLElement) => ({ destroy: registerTrigger(node) });
</script>

<div use:trigger class="flex w-full flex-col gap-4 sm:flex-row">
	{#each cards as card (card.id)}
		<button
			type="button"
			onclick={() => open(card)}
			class="focus-ring flex w-full min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 rounded-xl border border-zinc-800 bg-black p-6 text-left text-white transition-colors hover:bg-zinc-900 light:border-zinc-200 light:bg-white light:text-zinc-900 light:hover:bg-zinc-100"
		>
			<card.icon size={20} />
			<span class="mt-2 text-sm font-semibold text-white light:text-zinc-900">{card.title}</span>
			<span class="text-xs text-zinc-400 light:text-zinc-600">{card.description}</span>
		</button>
	{/each}
</div>
