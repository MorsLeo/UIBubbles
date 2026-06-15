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

	const groupName = $derived(`control-${label.toLowerCase().replaceAll(/\W+/g, "-")}`);
</script>

<fieldset class="flex flex-col gap-1.5">
	<legend class="text-xs text-zinc-400 light:text-zinc-600">{label}</legend>
	<div class="flex rounded-lg border border-zinc-800 p-0.5 light:border-zinc-300">
		{#each options as option (option.value)}
			<label
				class="relative flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:text-white has-checked:bg-zinc-800 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-zinc-500 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-black light:text-zinc-600 light:hover:text-zinc-900 light:has-checked:bg-zinc-900 light:has-checked:text-white light:has-focus-visible:ring-zinc-400 light:has-focus-visible:ring-offset-white"
			>
				<input
					type="radio"
					name={groupName}
					value={option.value}
					checked={value === option.value}
					onchange={() => onSelect(option.value)}
					class="sr-only"
				/>
				{option.label}
			</label>
		{/each}
	</div>
</fieldset>
