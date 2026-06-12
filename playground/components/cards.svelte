<script lang="ts">
	import { cards } from "$playground/cards";
	import type { Card } from "$playground/types";

	const {
		spawned,
		toggle
	}: {
		spawned: Record<string, boolean>;
		toggle: (card: Card) => void;
	} = $props();
</script>

<div class="flex w-full flex-col gap-4 sm:flex-row">
	{#each cards as card (card.id)}
		{@const active = spawned[card.id] ?? false}
		<button
			type="button"
			onclick={() => toggle(card)}
			class="focus-ring flex w-full cursor-pointer flex-col items-start gap-1 rounded-xl border p-6 text-left text-white transition-colors sm:flex-1 light:text-zinc-900 {active
				? 'border-zinc-600 bg-zinc-900 light:border-zinc-400 light:bg-zinc-100'
				: 'border-zinc-800 bg-black hover:bg-zinc-900 light:border-zinc-200 light:bg-white light:hover:bg-zinc-100'}"
		>
			<card.icon size={20} />
			<span class="mt-2 text-sm font-semibold text-white light:text-zinc-900">{card.title}</span>
			<span class="text-xs text-zinc-400 light:text-zinc-600">{card.description}</span>
		</button>
	{/each}
</div>
