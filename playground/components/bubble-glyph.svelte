<script lang="ts">
	import { config } from "$playground/config.svelte";
	import { glyphInk } from "$playground/options";
	import type { Component } from "svelte";

	// Mounted once per bubble and alive for its whole life, so the glyph
	// recolors itself when the config changes — configure() repaints the
	// surfaces, this keeps the consumer-supplied ink in step.
	const { icon: Icon }: { icon: Component<{ color?: string; size?: number }> } = $props();
</script>

<Icon color={glyphInk(config)} />
