<script lang="ts">
	import chevronLeftIcon from "$playground/icons/chevron-left.svg?raw";
	import sendIcon from "$playground/icons/send.svg?raw";
</script>

<div class="flex h-105 flex-col font-sans">
	<header class="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-3">
		<button
			type="button"
			aria-label="Back"
			class="-ml-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white"
		>
			{@html chevronLeftIcon}
		</button>
		<div class="flex min-w-0 flex-col gap-0.5">
			<span class="text-sm font-semibold">Chat Support</span>
			<span class="flex items-center gap-1.5 text-xs text-zinc-400">
				<span class="size-2 shrink-0 rounded-full bg-green-500"></span>
				Online — typically replies in a few minutes
			</span>
		</div>
	</header>
	<div class="flex-1"></div>
	<footer class="flex items-center gap-2 p-3">
		<input
			type="text"
			placeholder="Message"
			class="h-11 min-w-0 flex-1 rounded-full bg-zinc-800 px-4.5 text-sm text-white outline-none"
		/>
		<button
			type="button"
			aria-label="Send"
			class="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black [&_svg]:size-4.5"
		>
			{@html sendIcon}
		</button>
	</footer>
</div>
