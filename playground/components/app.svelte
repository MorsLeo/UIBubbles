<script lang="ts">
	import { untrack } from "svelte";
	import BubbleGlyph from "$playground/components/bubble-glyph.svelte";
	import { cards } from "$playground/cards";
	import Cards from "$playground/components/cards.svelte";
	import NavBar from "$playground/components/nav-bar.svelte";
	import { config } from "$playground/config.svelte";
	import { defaults } from "$playground/defaults";
	import { mountInto } from "$playground/mount";
	import { effectiveTheme, toBubblesOptions } from "$playground/options";
	import { configSnippet } from "$playground/snippet";
	import { writeConfig } from "$playground/url";
	import { createBubbles } from "$src/index";
	import type { Card } from "$playground/types";

	// The demo boots expanded up top — but only the boot. The recurring
	// configure() below omits initialState, so a flock re-toggled after
	// emptying enters docked at the side instead of covering the cards.
	const manager = createBubbles({ ...toBubblesOptions(config), initialState: "open" });
	let spawned = $state<Record<string, boolean>>({});

	// Panel content elements by card id — the library exposes no "which
	// panel is showing", so the chip checks visibility on the content
	// it handed over.
	const contents: Record<string, HTMLElement> = {};

	// Spawn order, oldest first — the eviction queue when the cap is hit.
	let order: string[] = [];

	const drop = (id: string) => {
		spawned[id] = false;
		order = order.filter((other) => other !== id);
	};

	// The README panel runs twice as wide as the rest — prose needs the
	// room — and rides the width slider at that multiple.
	const panelWidthFor = (card: Card): number | undefined =>
		card.id === "docs" ? config.panelWidth * 2 : undefined;

	const spawn = (card: Card): boolean => {
		contents[card.id] = mountInto(card.panel);
		const added = manager.add({
			id: card.id,
			label: card.title,
			icon: mountInto(BubbleGlyph, { icon: card.icon }),
			content: contents[card.id],
			panelWidth: panelWidthFor(card),
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

		// Scaled panels ride the width slider too: re-adding a mounted
		// bubble refreshes its sizing override in place.
		untrack(() => {
			for (const card of cards) {
				const width = panelWidthFor(card);
				if (width === undefined || !spawned[card.id]) continue;
				manager.add({
					id: card.id,
					label: card.title,
					panelWidth: width,
					onDismiss: () => drop(card.id)
				});
			}
		});
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

	// Compared as snippets so it stays honest if the demo defaults ever
	// diverge from the library's.
	const dirty = $derived(configSnippet(config) !== configSnippet(defaults));
	const reset = () => Object.assign(config, defaults);

	// The chip points at the live config, so clicking it surfaces the
	// settings panel: the bubble (re)joins under the usual cap rules and
	// the group opens if docked.
	const showSettings = () => {
		const settings = cards.find((card) => card.id === "settings");
		if (!settings) return;

		if (spawned[settings.id]) {
			// Already front and center — a reclaim would only blink the panel.
			if (contents[settings.id]?.checkVisibility()) return;

			// Remove-then-re-add reverses the exit before a frame paints — the
			// documented reclaim path, which also makes the bubble the latest
			// interaction and hands it the active panel.
			manager.remove(settings.id);
			manager.add({
				id: settings.id,
				label: settings.title,
				panelWidth: panelWidthFor(settings),
				onDismiss: () => drop(settings.id)
			});
		} else {
			while (order.length >= config.maxBubbles && evict());
			if (!spawn(settings)) return;
		}

		if (manager.state() === "docked") manager.toggle();
	};

	// The favicon flips with the page: each variant is the mark on a
	// rounded square in the theme's background/foreground pair. With
	// "auto", effectiveTheme tracks the OS preference reactively.
	$effect(() => {
		const light = effectiveTheme(config) === "light";
		document.documentElement.classList.toggle("light", light);
		const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
		if (favicon) favicon.href = light ? "/bubbles-light.svg" : "/bubbles-dark.svg";
	});
</script>

<NavBar />

<div class="flex min-h-dvh flex-col items-center p-6 font-sans">
	<!-- my-auto centers the content in the leftover space while the
	     footer keeps its in-flow spot at the bottom of the column. -->
	<main class="my-auto flex w-full max-w-152 flex-col items-center gap-8">
		<header class="flex flex-col items-center gap-3 text-center">
			<h1 class="text-3xl font-semibold tracking-tight text-white light:text-zinc-900">bubbles</h1>
			<p class="max-w-md text-sm text-zinc-400 light:text-zinc-600">
				Android-style app bubbles for any website. Drag them, fling them, stack them — then open
				the settings bubble to make them yours.
			</p>
		</header>

		<Cards {spawned} {toggle} {dirty} {reset} {showSettings} />
	</main>

	<footer class="mt-8 text-xs text-zinc-500 light:text-zinc-600">
		Built by
		<a
			href="https://www.youtube.com/@Hyperplexed"
			target="_blank"
			rel="noopener"
			class="focus-ring rounded font-semibold text-zinc-300 transition-colors hover:text-white light:text-zinc-700 light:hover:text-zinc-900"
		>
			@Hyperplexed
		</a>
	</footer>
</div>
