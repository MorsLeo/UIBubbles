<script lang="ts">
	import DocsIcon from "$playground/components/icons/docs-icon.svelte";

	const docs = [
		{ title: "Getting started", description: "Install, mount, and add your first bubble" },
		{ title: "API reference", description: "createBubbles, BubbleOptions, manager methods" },
		{ title: "Physics tuning", description: "Friction, springs, and the feel constants" },
		{ title: "Panel content", description: "Mounting any framework into a bubble panel" },
		{ title: "Dismissal", description: "The removal target and onDismiss" }
	];
</script>

<div class="flex h-105 min-h-0 flex-col font-sans">
	<header class="flex items-center gap-3 border-b border-zinc-800 p-3">
		<div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
			<DocsIcon size={16} />
		</div>
		<div class="flex min-w-0 flex-col">
			<span class="truncate text-sm font-semibold">Docs</span>
			<span class="truncate text-xs text-zinc-400">Guides and reference</span>
		</div>
	</header>
	<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
		{#each docs as doc (doc.title)}
			<button
				type="button"
				class="flex cursor-pointer flex-col rounded-md bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
			>
				<span class="truncate text-sm font-medium">{doc.title}</span>
				<span class="truncate text-xs text-zinc-400">{doc.description}</span>
			</button>
		{/each}
	</div>
</div>
