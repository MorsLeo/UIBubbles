<script lang="ts">
	import { untrack } from "svelte";
	import BubbleGlyph from "$playground/components/bubble-glyph.svelte";
	import { cards } from "$playground/cards";
	import Cards from "$playground/components/cards.svelte";
	import NavBar from "$playground/components/nav-bar.svelte";
	import { config } from "$playground/config.svelte";
	import { defaults } from "$playground/defaults";
	import { mountInto } from "$playground/mount";
	import { toBubblesOptions } from "$playground/options";
	import { configSnippet } from "$playground/snippet";
	import { writeConfig } from "$playground/url";
	import { createBubbles } from "$src/index";
	import type { Card } from "$playground/types";

	const manager = createBubbles(toBubblesOptions(config));
	let spawned = $state<Record<string, boolean>>({});

	// Spawn order, oldest first — the eviction queue when the cap is hit.
	let order: string[] = [];

	const drop = (id: string) => {
		spawned[id] = false;
		order = order.filter((other) => other !== id);
	};

	const spawn = (card: Card): boolean => {
		const added = manager.add({
			id: card.id,
			label: card.title,
			icon: mountInto(BubbleGlyph, { icon: card.icon }),
			content: mountInto(card.panel),
			onDismiss: () => drop(card.id)
		});
		spawned[card.id] = added;
		if (added) order.push(card.id);
		return added;
	};

	// FIFO eviction that spares settings — the demo's escape hatch; a
	// dead settings bubble would strand the cap it enforces.
	const evict = (): boolean => {
		const victim = order.find((id) => id !== "settings") ?? order[0];
		if (victim === undefined) return false;
		manager.remove(victim);
		drop(victim);
		return true;
	};

	const toggle = (card: Card) => {
		if (spawned[card.id]) {
			manager.remove(card.id);
			drop(card.id);
			return;
		}
		// At the cap, the oldest bubble makes room instead of the card
		// going dead — every card stays a live control.
		while (order.length >= config.maxBubbles && evict());
		spawn(card);
	};

	// Boot: bubbles spawn straight into the open row (initialState), in
	// reverse display order so the first card ends newest — leftmost in
	// the row, panel showing. The slice keeps settings inside a URL-capped
	// boot.
	$effect(() => {
		untrack(() => {
			for (const card of cards.slice(0, config.maxBubbles).reverse()) spawn(card);
		});
		return () => manager.destroy();
	});

	// Config changes apply in place — surfaces repaint, panels reflow,
	// nothing re-enters. Dock side/vertical land on the next fresh entry
	// (page load, or after the flock is cleared), per the library contract.
	$effect(() => {
		manager.configure(toBubblesOptions(config));
	});

	// A lowered cap applies immediately. The library never evicts on
	// configure — eviction policy is the consumer's — so the demo runs
	// its own queue the moment the stepper drops.
	$effect(() => {
		const cap = config.maxBubbles;
		untrack(() => {
			while (order.length > cap && evict());
		});
	});

	$effect(() => writeConfig(config));

	const dirty = $derived(configSnippet(config) !== "createBubbles();");
	const reset = () => Object.assign(config, defaults);

	// The favicon flips with the page: each variant is the mark on a
	// rounded square in the theme's background/foreground pair.
	$effect(() => {
		const light = config.theme === "light";
		document.documentElement.classList.toggle("light", light);
		const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
		if (favicon) favicon.href = light ? "/bubbles-light.svg" : "/bubbles-dark.svg";
	});
</script>

<NavBar />

<div class="flex min-h-dvh flex-col items-center justify-center p-6 font-sans">
	<main class="flex w-full max-w-152 flex-col items-center gap-8">
		<header class="flex flex-col items-center gap-3 text-center">
			<h1 class="text-3xl font-semibold tracking-tight text-white light:text-zinc-900">bubbles</h1>
			<p class="max-w-md text-sm text-zinc-400 light:text-zinc-600">
				Android-style app bubbles for any website. Drag them, fling them, stack them — then open
				the settings bubble to make them yours.
			</p>
		</header>

		<Cards {spawned} {toggle} />

		{#if dirty}
			<div
				class="flex items-center gap-3 rounded-full border border-zinc-800 py-1.5 pr-3 pl-4 text-xs text-zinc-400 light:border-zinc-200 light:text-zinc-600"
			>
				<span class="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
				Custom config active
				<button
					type="button"
					onclick={reset}
					class="focus-ring cursor-pointer rounded-full px-1 font-semibold text-zinc-300 transition-colors hover:text-white light:text-zinc-700 light:hover:text-zinc-900"
				>
					Reset
				</button>
			</div>
		{/if}
	</main>
</div>
