<script lang="ts">
	const {
		label,
		min,
		max,
		step,
		value,
		format = (v: number) => `${v}`,
		onCommit
	}: {
		label: string;
		min: number;
		max: number;
		step: number;
		value: number;
		format?: (value: number) => string;
		onCommit: (value: number) => void;
	} = $props();

	// The label previews the drag live; the config only commits on release
	// so the flock isn't rebuilt sixty times a second mid-drag.
	let pending = $state<number | undefined>(undefined);
	const shown = $derived(pending ?? value);
</script>

<label class="flex flex-col gap-1.5">
	<span class="flex items-baseline justify-between text-xs">
		<span class="text-zinc-400 light:text-zinc-600">{label}</span>
		<span class="text-zinc-400 light:text-zinc-600">{format(shown)}</span>
	</span>
	<input
		type="range"
		{min}
		{max}
		{step}
		value={shown}
		oninput={(event) => (pending = Number(event.currentTarget.value))}
		onchange={(event) => {
			pending = undefined;
			onCommit(Number(event.currentTarget.value));
		}}
		class="focus-ring w-full cursor-pointer rounded-full accent-white light:accent-zinc-900"
	/>
</label>
