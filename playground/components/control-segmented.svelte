<script lang="ts" generics="T extends string">
	const {
		label,
		options,
		value,
		onSelect
	}: {
		label: string;
		options: { value: T; label: string }[];
		value: T;
		onSelect: (value: T) => void;
	} = $props();
</script>

<div class="flex flex-col gap-1.5">
	<span class="text-xs text-zinc-400 light:text-zinc-600">{label}</span>
	<div class="flex rounded-lg border border-zinc-800 p-0.5 light:border-zinc-300">
		{#each options as option (option.value)}
			<button
				type="button"
				aria-pressed={value === option.value}
				onclick={() => onSelect(option.value)}
				class="focus-ring flex-1 cursor-pointer rounded-md px-2 py-1 text-xs transition-colors {value ===
				option.value
					? 'bg-zinc-800 text-white light:bg-zinc-900'
					: 'text-zinc-400 hover:text-white light:text-zinc-600 light:hover:text-zinc-900'}"
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>
