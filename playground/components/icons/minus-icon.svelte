<script lang="ts">
	const { color = "currentColor", size = 24 }: { color?: string; size?: number } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	aria-hidden="true"
	focusable="false"
	fill="none"
	stroke={color}
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d="M5 12h14" />
</svg>
