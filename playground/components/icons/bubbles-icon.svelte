<script lang="ts">
	const { size = 24 }: { size?: number } = $props();
</script>

<!-- The brand mark: three equal overlapping bubbles in one solid ink.
     Page-colored gap discs under the middle and right circles carve the
     separation without shrinking any circle's fill. Mirrors public/. -->
<svg viewBox="0 0 48 24" width={size * 2} height={size}>
	<circle cx="10" cy="12" r="8.5" fill="currentColor" />
	<circle cx="24" cy="12" r="10" class="fill-black light:fill-white" />
	<circle cx="24" cy="12" r="8.5" fill="currentColor" />
	<circle cx="38" cy="12" r="10" class="fill-black light:fill-white" />
	<circle cx="38" cy="12" r="8.5" fill="currentColor" />
</svg>
