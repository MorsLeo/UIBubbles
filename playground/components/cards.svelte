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
</script>

<!-- A floating, bottom-mounted control bar — fixed and centered on every
     breakpoint, clearing the home indicator via the safe-area inset. Each
     button toggles its bubble, lit while that bubble is present. -->
<div
	class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
>
	<div
		use:trigger
		class="pointer-events-auto flex items-center gap-1 rounded-2xl border border-zinc-800 bg-black/70 p-1.5 shadow-lg backdrop-blur-md light:border-zinc-200 light:bg-white/70"
	>
		{#each cards as card (card.id)}
			<button
				type="button"
				onclick={() => toggle(card)}
				aria-pressed={spawned[card.id] ? "true" : "false"}
				aria-label={card.title}
				class="focus-ring flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors {spawned[
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
