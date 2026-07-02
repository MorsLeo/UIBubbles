<script lang="ts">
	import type { Snippet } from "svelte";

	// Mounted (not rendered) into a bubble's icon/content host element. The
	// prop object is $state owned by <Bubble>, so a swapped snippet — and
	// anything reactive the snippet reads — keeps rendering live here.
	let { snippet }: { snippet: Snippet | undefined } = $props();
</script>

{@render snippet?.()}
