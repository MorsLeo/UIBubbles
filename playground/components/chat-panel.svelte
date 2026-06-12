<script lang="ts">
	import ChatIcon from "$playground/components/icons/chat-icon.svelte";
	import SendIcon from "$playground/components/icons/send-icon.svelte";
</script>

<div class="flex h-105 min-h-0 flex-col font-sans">
	<header class="flex items-center gap-3 border-b border-zinc-800 p-3">
		<div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
			<ChatIcon size={16} />
		</div>
		<div class="flex min-w-0 flex-col">
			<span class="truncate text-sm font-semibold">Chat Support</span>
			<span class="truncate text-xs text-zinc-400">Typically replies in a few minutes</span>
		</div>
	</header>
	<div class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
		<span class="text-sm text-zinc-500">No messages yet</span>
	</div>
	<footer class="flex items-center gap-2 p-3">
		<input
			type="text"
			placeholder="Message"
			aria-label="Message"
			class="h-11 min-w-0 flex-1 rounded-md bg-zinc-800 px-4.5 text-sm text-white outline-none"
		/>
		<button
			type="button"
			aria-label="Send"
			class="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md bg-white text-black"
		>
			<SendIcon size={18} />
		</button>
	</footer>
</div>
