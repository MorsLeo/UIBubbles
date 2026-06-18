<script lang="ts">
	import DocsIcon from "$playground/components/icons/docs-icon.svelte";
	import { marked } from "marked";
	import readme from "../../README.md?raw";

	// The panel renders the actual README — one source of truth. Relative
	// repo links resolve to GitHub; external links open a new tab.
	const externalLinkNote = '<span class="sr-only"> (opens in new tab)</span>';

	const html = (marked.parse(readme, { async: false }) as string)
		.replaceAll(
			'href="LICENSE"',
			'href="https://github.com/githyperplexed/bubbles/blob/main/LICENSE"'
		)
		.replaceAll('<a href="http', '<a target="_blank" rel="noreferrer" href="http')
		.replace(/<a target="_blank" rel="noreferrer" href="http[^"]+">([\s\S]*?)<\/a>/g, (anchor) =>
			anchor.replace("</a>", `${externalLinkNote}</a>`)
		);
</script>

<div class="flex min-h-0 flex-col font-sans">
	<div class="flex items-center gap-3 border-b border-zinc-800 p-3 light:border-zinc-200">
		<div
			class="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white light:bg-black/5 light:text-zinc-900"
		>
			<DocsIcon size={16} />
		</div>
		<div class="flex min-w-0 flex-col">
			<span class="truncate text-sm font-semibold">Docs</span>
			<span class="truncate text-xs text-zinc-400 light:text-zinc-600"> The README </span>
		</div>
	</div>
	<div class="docs-content panel-scroll mb-4 min-h-0 flex-1 overflow-y-auto p-4 pb-0 text-sm">
		{@html html}
	</div>
</div>

<style>
	/* Theme-agnostic typography: inks ride currentColor (the library's
	   panelText flips it), surfaces ride a neutral translucent gray. */
	.docs-content :global(h1) {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
	}
	.docs-content :global(h2) {
		margin: 1.5rem 0 0.5rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.docs-content :global(h3) {
		margin: 1.25rem 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
	}
	.docs-content :global(p),
	.docs-content :global(ul) {
		margin: 0.5rem 0;
		line-height: 1.6;
		opacity: 0.85;
	}
	.docs-content :global(ul) {
		padding-left: 1.25rem;
		list-style: disc;
	}
	.docs-content :global(li) {
		margin: 0.25rem 0;
	}
	.docs-content :global(a) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.docs-content :global(code) {
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		background: rgb(128 128 128 / 0.18);
		font-size: 0.8125rem;
	}
	.docs-content :global(pre) {
		margin: 0.75rem 0;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: rgb(128 128 128 / 0.15);
		overflow-x: auto;
	}
	.docs-content :global(pre code) {
		padding: 0;
		background: none;
	}
	.docs-content :global(table) {
		display: block;
		margin: 0.75rem 0;
		overflow-x: auto;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}
	.docs-content :global(th),
	.docs-content :global(td) {
		padding: 0.375rem 0.625rem;
		border: 1px solid rgb(128 128 128 / 0.3);
		text-align: left;
	}
	.docs-content :global(blockquote) {
		margin: 0.75rem 0;
		padding-left: 0.75rem;
		border-left: 2px solid rgb(128 128 128 / 0.4);
		opacity: 0.8;
	}
</style>
