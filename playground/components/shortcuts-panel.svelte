<script lang="ts">
	import KeyboardIcon from "$playground/components/icons/keyboard-icon.svelte";

	interface Shortcut {
		keys: string[];
		action: string;
	}

	const sections: { title: string; shortcuts: Shortcut[] }[] = [
		{
			title: "Anywhere",
			shortcuts: [{ keys: ["Tab"], action: "Focus the bubbles" }]
		},
		{
			title: "Docked stack",
			shortcuts: [
				{ keys: ["Enter"], action: "Expand the stack" },
				{ keys: ["←", "→"], action: "Send to the other edge" },
				{ keys: ["↑", "↓"], action: "Scoot the stack" },
				{ keys: ["Ctrl", "↑"], action: "Scoot all the way" }
			]
		},
		{
			title: "Open row",
			shortcuts: [
				{ keys: ["←", "→"], action: "Move between bubbles" },
				{ keys: ["Enter"], action: "Open, or collapse the active one" },
				{ keys: ["Del"], action: "Dismiss the bubble" },
				{ keys: ["Esc"], action: "Collapse the row" }
			]
		}
	];
</script>

<div class="flex min-h-0 flex-col font-sans">
	<header class="flex items-center gap-3 border-b border-zinc-800 p-3 light:border-zinc-200">
		<div
			class="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white light:bg-black/5 light:text-zinc-900"
		>
			<KeyboardIcon size={16} />
		</div>
		<div class="flex min-w-0 flex-col">
			<span class="truncate text-sm font-semibold">Shortcuts</span>
			<span class="truncate text-xs text-zinc-400 light:text-zinc-600">
				Everything works without a mouse
			</span>
		</div>
	</header>

	<div class="panel-scroll mb-4 flex min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-0">
		{#each sections as section (section.title)}
			<div class="flex flex-col gap-2">
				<span class="text-xs font-medium tracking-wide text-zinc-500 uppercase">
					{section.title}
				</span>
				<div class="flex flex-col gap-2.5">
					{#each section.shortcuts as shortcut (shortcut.action)}
						<div class="flex items-center justify-between gap-4">
							<span class="text-sm text-zinc-300 light:text-zinc-700">{shortcut.action}</span>
							<span class="flex shrink-0 items-center gap-1">
								{#each shortcut.keys as key (key)}
									<kbd
										class="rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-400 light:border-zinc-300 light:bg-zinc-100 light:text-zinc-600"
									>
										{key}
									</kbd>
								{/each}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
