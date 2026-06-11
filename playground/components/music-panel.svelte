<div class="flex flex-col gap-4 p-4 font-sans">
	<div class="aspect-square w-full rounded-lg bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
	<div class="flex min-w-0 flex-col">
		<span class="truncate text-sm font-semibold">Midnight Drive</span>
		<span class="truncate text-xs text-zinc-400">The Perplexed</span>
	</div>
	<div class="flex flex-col gap-1.5">
		<div class="h-1 w-full rounded-full bg-white/10">
			<div class="h-full w-1/3 rounded-full bg-white"></div>
		</div>
		<div class="flex justify-between text-xs text-zinc-500">
			<span>1:04</span>
			<span>3:12</span>
		</div>
	</div>
	<div class="flex items-center justify-center gap-4">
		<button
			type="button"
			aria-label="Previous"
			class="flex size-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
				<polygon points="19 20 9 12 19 4 19 20" />
				<rect x="5" y="4" width="2" height="16" rx="1" />
			</svg>
		</button>
		<button
			type="button"
			aria-label="Play"
			class="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white text-black"
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
				<polygon points="7 4 21 12 7 20 7 4" />
			</svg>
		</button>
		<button
			type="button"
			aria-label="Next"
			class="flex size-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
				<polygon points="5 4 15 12 5 20 5 4" />
				<rect x="17" y="4" width="2" height="16" rx="1" />
			</svg>
		</button>
	</div>
</div>
