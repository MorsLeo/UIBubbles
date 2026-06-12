<script lang="ts">
	import ControlSegmented from "$playground/components/control-segmented.svelte";
	import ControlSlider from "$playground/components/control-slider.svelte";
	import CheckIcon from "$playground/components/icons/check-icon.svelte";
	import CopyIcon from "$playground/components/icons/copy-icon.svelte";
	import GearIcon from "$playground/components/icons/gear-icon.svelte";
	import MinusIcon from "$playground/components/icons/minus-icon.svelte";
	import PlusIcon from "$playground/components/icons/plus-icon.svelte";
	import { config } from "$playground/config.svelte";
	import { AUTO_PANEL_MAX_HEIGHT, defaults, ranges } from "$playground/defaults";
	import { configSnippet } from "$playground/snippet";
	import type { Swatch } from "$playground/types";

	// White and black included on purpose: the contrast-aware glyph keeps
	// them readable on either theme. The rest ride the Tailwind palette
	// (violet-600, sky-500, emerald-500, amber-500, rose-500).
	const swatches: Swatch[] = [
		{ name: "White", hex: "ffffff" },
		{ name: "Black", hex: "000000" },
		{ name: "Violet", hex: "7c3aed" },
		{ name: "Sky", hex: "0ea5e9" },
		{ name: "Emerald", hex: "10b981" },
		{ name: "Amber", hex: "f59e0b" },
		{ name: "Rose", hex: "f43f5e" }
	];

	// A ring marks the selected swatch — a border couldn't mark white on
	// a white panel; the faint inner border keeps same-color swatches
	// visible at all.
	const swatchRing = (selected: boolean) =>
		selected
			? "ring-2 ring-zinc-400 ring-offset-2 ring-offset-black light:ring-zinc-500 light:ring-offset-white"
			: "";

	let copied = $state(false);

	/** A custom-picked accent: set, but not one of the curated swatches. */
	const customAccent = $derived(
		config.color !== undefined && !swatches.some((swatch) => swatch.hex === config.color)
	);

	const snippet = $derived(configSnippet(config));
	const dirty = $derived(snippet !== "createBubbles();");

	const copy = async () => {
		await navigator.clipboard.writeText(snippet);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	};

	// Sliders hand back float-noise like 0.35000000000000003; two decimals
	// keep the URL and snippet honest.
	const commitVertical = (value: number) => (config.vertical = Math.round(value * 100) / 100);

	const reset = () => Object.assign(config, defaults);
</script>

<div class="flex min-h-0 flex-col font-sans">
	<header class="flex items-center gap-3 border-b border-zinc-800 p-3 light:border-zinc-200">
		<div
			class="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white light:bg-black/5 light:text-zinc-900"
		>
			<GearIcon size={16} />
		</div>
		<div class="flex min-w-0 flex-1 flex-col">
			<span class="truncate text-sm font-semibold">Customize</span>
			<span class="truncate text-xs text-zinc-400 light:text-zinc-600">Changes apply live</span>
		</div>
	</header>

	<div class="panel-scroll mb-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-0">
		<div class="grid grid-cols-2 gap-4">
			<ControlSegmented
				label="Theme"
				options={[
					{ value: "dark", label: "Dark" },
					{ value: "light", label: "Light" }
				]}
				value={config.theme}
				onSelect={(theme) => (config.theme = theme)}
			/>

			<ControlSegmented
				label="Dock side"
				options={[
					{ value: "left", label: "Left" },
					{ value: "right", label: "Right" }
				]}
				value={config.side}
				onSelect={(side) => (config.side = side)}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-xs text-zinc-400 light:text-zinc-600">Accent</span>
			<div class="flex flex-wrap items-center gap-2">
				<!-- The "no accent" reset: clears the override so the preset's
				     own surfaces apply and the snippet drops its colors line. -->
				<button
					type="button"
					aria-label="No accent"
					aria-pressed={config.color === undefined}
					class="focus-ring flex size-6 cursor-pointer items-center justify-center rounded-full border border-zinc-600 text-zinc-500 light:border-zinc-400 {swatchRing(
						config.color === undefined
					)}"
					onclick={() => (config.color = undefined)}
				>
					<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
						<line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" stroke-width="2" />
					</svg>
				</button>
				{#each swatches as swatch (swatch.hex)}
					<button
						type="button"
						aria-label={swatch.name}
						aria-pressed={config.color === swatch.hex}
						onclick={() => (config.color = swatch.hex)}
						style="background-color: #{swatch.hex}"
						class="focus-ring size-6 cursor-pointer rounded-full border border-white/15 light:border-black/15 {swatchRing(
							config.color === swatch.hex
						)}"
					></button>
				{/each}
				<!-- Custom picker, dressed as another swatch: a rainbow circle
				     (Tailwind palette hues, blended smoothly — hard stops read
				     as corners at this size) wearing the chosen color once one
				     is picked; the native input hides inside it. -->
				<label
					style={customAccent
						? `background-color: #${config.color}`
						: "background: linear-gradient(135deg, #ef4444, #f59e0b, #84cc16, #06b6d4, #3b82f6, #d946ef)"}
					class="relative size-6 cursor-pointer rounded-full border border-white/15 transition-shadow light:border-black/15 has-focus-visible:ring-2 has-focus-visible:ring-zinc-500 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-black light:has-focus-visible:ring-zinc-400 light:has-focus-visible:ring-offset-white {swatchRing(
						customAccent
					)}"
				>
					<span class="sr-only">Custom accent</span>
					<input
						type="color"
						value="#{config.color ?? '7c3aed'}"
						onchange={(event) => (config.color = event.currentTarget.value.slice(1))}
						class="absolute inset-0 cursor-pointer opacity-0 outline-none"
					/>
				</label>
			</div>
		</div>

		<ControlSlider
			label="Dock vertical"
			min={ranges.vertical.min}
			max={ranges.vertical.max}
			step={ranges.vertical.step}
			value={config.vertical}
			format={(v) => `${Math.round(v * 100)}%`}
			onCommit={commitVertical}
		/>

		<ControlSlider
			label="Panel width"
			min={ranges.panelWidth.min}
			max={ranges.panelWidth.max}
			step={ranges.panelWidth.step}
			value={config.panelWidth}
			format={(v) => `${v}px`}
			onCommit={(v) => (config.panelWidth = v)}
		/>

		<ControlSlider
			label="Panel max height"
			min={ranges.panelMaxHeight.min}
			max={ranges.panelMaxHeight.max}
			step={ranges.panelMaxHeight.step}
			value={config.panelMaxHeight}
			format={(v) => (v === AUTO_PANEL_MAX_HEIGHT ? "Auto" : `${v}px`)}
			onCommit={(v) => (config.panelMaxHeight = v)}
		/>

		<div class="flex items-center justify-between">
			<span class="text-xs text-zinc-400 light:text-zinc-600">Max bubbles</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					aria-label="Fewer bubbles"
					disabled={config.maxBubbles <= ranges.maxBubbles.min}
					onclick={() => (config.maxBubbles -= 1)}
					class="focus-ring flex size-6 cursor-pointer items-center justify-center rounded-md border border-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 light:border-zinc-300"
				>
					<MinusIcon size={12} />
				</button>
				<span class="w-4 text-center text-xs">{config.maxBubbles}</span>
				<button
					type="button"
					aria-label="More bubbles"
					disabled={config.maxBubbles >= ranges.maxBubbles.max}
					onclick={() => (config.maxBubbles += 1)}
					class="focus-ring flex size-6 cursor-pointer items-center justify-center rounded-md border border-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 light:border-zinc-300"
				>
					<PlusIcon size={12} />
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="flex items-center justify-between">
				<span class="text-xs text-zinc-400 light:text-zinc-600">Your config</span>
				<span class="flex items-center gap-2">
					{#if dirty}
						<button
							type="button"
							onclick={reset}
							class="focus-ring flex h-6 cursor-pointer items-center rounded-md border border-zinc-700 px-2 text-xs light:border-zinc-300"
						>
							Reset
						</button>
					{/if}
					<button
						type="button"
						aria-label="Copy config"
						onclick={copy}
						class="focus-ring flex size-6 cursor-pointer items-center justify-center rounded-md border border-zinc-700 light:border-zinc-300"
					>
						{#if copied}
							<CheckIcon size={12} />
						{:else}
							<CopyIcon size={12} />
						{/if}
					</button>
				</span>
			</span>
			<pre
				class="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300 light:bg-zinc-100 light:text-zinc-700"><code
					>{snippet}</code
				></pre>
		</div>

	</div>
</div>
