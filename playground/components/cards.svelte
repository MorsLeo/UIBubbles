<script lang="ts">
	import { cards } from "$playground/cards";
	import type { Card } from "$playground/types";

	const {
		spawned,
		toggle,
		dirty,
		reset,
		showSettings
	}: {
		spawned: Record<string, boolean>;
		toggle: (card: Card) => void;
		dirty: boolean;
		reset: () => void;
		showSettings: () => void;
	} = $props();
</script>

{#snippet cardButton(card: Card)}
	{@const active = spawned[card.id] ?? false}
	<button
		type="button"
		onclick={() => toggle(card)}
		class="focus-ring relative z-10 flex w-full flex-1 cursor-pointer flex-col items-start gap-1 rounded-xl border p-6 text-left text-white transition-colors light:text-zinc-900 {active
			? 'border-zinc-600 bg-zinc-900 light:border-zinc-400 light:bg-zinc-100'
			: 'border-zinc-800 bg-black hover:bg-zinc-900 light:border-zinc-200 light:bg-white light:hover:bg-zinc-100'}"
	>
		<card.icon size={20} />
		<span class="mt-2 text-sm font-semibold text-white light:text-zinc-900">{card.title}</span>
		<span class="text-xs text-zinc-400 light:text-zinc-600">{card.description}</span>
	</button>
{/snippet}

<div class="flex w-full flex-col gap-4 sm:flex-row">
	{#each cards as card (card.id)}
		<!-- Identical wrappers keep the three columns symmetric flex items,
		     and min-w-0 drops the content-based minimum so flex-1 splits
		     the row exactly evenly. -->
		<div class="relative flex w-full min-w-0 flex-col sm:flex-1">
			{@render cardButton(card)}
			<!-- Every card gets a footer tray peeking out below it (only the
			     settings card's holds content), so the row stays uniform.
			     The tray tucks up under the card by the card's corner radius
			     (12px) — the card paints over it via z-10 — so it hugs the
			     rounded bottom with no gap. Side by side (sm+) the trays are
			     absolute so the cards keep equal heights; stacked, they flow
			     between the cards. -->
			<footer
				class="-mt-3 flex h-10 items-center justify-between rounded-b-xl bg-zinc-800 px-4 pt-3 text-xs text-zinc-400 light:bg-zinc-200 light:text-zinc-600 sm:absolute sm:inset-x-0 sm:top-full"
			>
				{#if card.id === "settings"}
					<button
						type="button"
						onclick={showSettings}
						class="focus-ring flex cursor-pointer items-center gap-2 rounded-full px-1 transition-colors hover:text-zinc-200 light:hover:text-zinc-800"
					>
						<span
							class="size-1.5 rounded-full {dirty ? 'bg-amber-500' : 'bg-emerald-500'}"
							aria-hidden="true"
						></span>
						{dirty ? "Custom" : "Default"}
					</button>
					{#if dirty}
						<button
							type="button"
							onclick={reset}
							class="focus-ring cursor-pointer rounded-full px-1 font-semibold text-zinc-300 transition-colors hover:text-white light:text-zinc-700 light:hover:text-zinc-900"
						>
							Reset
						</button>
					{/if}
				{/if}
			</footer>
		</div>
	{/each}
</div>
