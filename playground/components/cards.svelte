<script lang="ts">
	import { cards } from "$playground/cards";
	import type { Card } from "$playground/types";

	const {
		toggle,
		spawned,
		registerTrigger
	}: {
		toggle: (card: Card) => void;
		spawned: Record<string, boolean>;
		registerTrigger: (el: HTMLElement) => () => void;
	} = $props();

	// The buttons toggle bubbles in and out, so a press is a trigger, not a
	// tap-away — registering the row keeps a toggle-in from collapsing the
	// flock a beat before the new bubble enters.
	const trigger = (node: HTMLElement) => ({ destroy: registerTrigger(node) });

	// Connected look: each button keeps the row's roundedness on its outer
	// corners and goes sharp (xs) on the inner corners facing a neighbor.
	const corners = (i: number, total: number): string => {
		if (total === 1) return "rounded-xl";
		if (i === 0) return "rounded-l-xl rounded-r-xs";
		if (i === total - 1) return "rounded-l-xs rounded-r-xl";
		return "rounded-xs";
	};
</script>

<!-- A floating, bottom-mounted control bar — fixed and centered on every
     breakpoint, clearing the home indicator via the safe-area inset. Each
     button toggles its bubble, lit while that bubble is present. -->
<div
	class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
>
	<div
		use:trigger
		class="pointer-events-auto flex items-center gap-1 rounded-2xl bg-zinc-900 p-1 shadow-lg light:bg-white"
	>
		{#each cards as card, i (card.id)}
			<button
				type="button"
				onclick={() => toggle(card)}
				aria-pressed={spawned[card.id] ? "true" : "false"}
				aria-label={card.title}
				class="focus-ring flex cursor-pointer items-center gap-2 {corners(i, cards.length)} px-3.5 py-2.5 text-sm font-medium transition-colors {spawned[
					card.id
				]
					? 'bg-zinc-800 text-white light:bg-zinc-200 light:text-zinc-900'
					: 'text-zinc-400 hover:bg-zinc-900 hover:text-white light:text-zinc-600 light:hover:bg-zinc-100 light:hover:text-zinc-900'}"
			>
				<card.icon size={18} />
				<span class="hidden xs:inline">{card.title}</span>
			</button>
		{/each}
	</div>
</div>
