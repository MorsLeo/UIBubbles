<script lang="ts">
	import { cards } from "$playground/cards";
	import BubbleGlyph from "$playground/components/bubble-glyph.svelte";
	import Cards from "$playground/components/cards.svelte";
	import NavBar from "$playground/components/nav-bar.svelte";
	import { config } from "$playground/config.svelte";
	import { mountInto } from "$playground/mount";
	import { effectiveTheme, toBubblesOptions } from "$playground/options";
	import type { Card } from "$playground/types";
	import { writeConfig } from "$playground/url";
	import { createBubbles, type PanelLength } from "$src/index";
	import { untrack } from "svelte";

	// The navbar toggles bubbles in and out, and an incoming bubble should
	// always fall in from the top into the open row — never dock in from the
	// side. So the group stays "open" for its whole life: at boot, on every
	// configure() below, and when an emptied flock is reborn.
	const manager = createBubbles({ ...toBubblesOptions(config), initialState: "open" });
	let spawned = $state<Record<string, boolean>>({});

	// Spawn order, oldest first — the eviction queue when the cap is hit.
	let order: string[] = [];

	const drop = (id: string) => {
		spawned[id] = false;
		order = order.filter((other) => other !== id);
	};

	// A user dismissal (drag to the target, or Delete) is the one removal the
	// demo doesn't initiate, so it learns about it through the manager rather
	// than an onDismiss wired onto every bubble. dismiss fires the instant the
	// user commits — before the bubble finishes flying off — so the card
	// un-highlights right away instead of waiting out the exit (the later
	// remove event lags behind that animation). Programmatic removals — a card
	// toggled off, an eviction — drop() synchronously at the call site, so
	// they need no handler here.
	manager.on("dismiss", ({ id }) => drop(id));

	// The README panel gets a fixed width — prose needs the room — and caps
	// its height at 70% of the viewport so the long readme scrolls inside a
	// contained panel; the "%" tracks resizes on its own. The rest ride the
	// configurable panel width and the default height.
	const DOCS_PANEL_WIDTH = 960;
	const DOCS_PANEL_MAX_HEIGHT = "70%";

	const panelWidthFor = (card: Card): number | undefined =>
		card.id === "docs" ? DOCS_PANEL_WIDTH : undefined;

	const panelMaxHeightFor = (card: Card): PanelLength | undefined =>
		card.id === "docs" ? DOCS_PANEL_MAX_HEIGHT : undefined;

	const spawn = (card: Card): boolean => {
		const added = manager.add({
			id: card.id,
			label: card.title,
			icon: mountInto(BubbleGlyph, { icon: card.icon }),
			content: mountInto(card.panel),
			panelWidth: panelWidthFor(card),
			panelMaxHeight: panelMaxHeightFor(card)
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

	// Each navbar button is a toggle. A press on a present bubble removes it —
	// it exits toward wherever it sits (up from the open row, or off its
	// docked side), the library's own retire animation. A press on an absent
	// one brings it in from the top: make room under the cap, make sure the
	// group is open so the entrant falls in rather than docking from the side,
	// then spawn — add() lands it active with its panel showing.
	const toggleCard = (card: Card) => {
		if (spawned[card.id]) {
			manager.remove(card.id);
			drop(card.id);
			return;
		}

		// At the cap, the oldest bubble makes room instead of the click going
		// dead — every button stays a live control.
		while (order.length >= config.maxBubbles && evict());

		// A collapsed-but-occupied flock opens first, so the new bubble joins
		// an open row from the top. An empty group is already "open" (its
		// initialState), so this no-ops and the first bubble is born up top.
		if (manager.state() === "docked") manager.toggle();
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
	// nothing re-enters. initialState stays "open" so a flock cleared and
	// refilled is reborn into the open row (the navbar's entry-from-top), not
	// docked. Dock side/vertical still land on the next fresh entry.
	$effect(() => {
		manager.configure({ ...toBubblesOptions(config), initialState: "open" });
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
	<main class="my-auto flex w-full max-w-152 flex-col items-center gap-3 text-center">
		<h1 class="text-3xl font-semibold tracking-tight text-white light:text-zinc-900">bubbles</h1>
		<p class="max-w-md text-sm text-zinc-400 light:text-zinc-600">
			Android-style app bubbles for any website. Drag them, fling them, stack them — then open the
			settings bubble to make them yours.
		</p>
	</main>
</div>

<Cards toggle={toggleCard} {spawned} registerTrigger={manager.registerTrigger} />
