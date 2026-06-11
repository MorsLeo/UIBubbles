<script lang="ts">
	import chevronLeftIcon from "$playground/icons/chevron-left.svg?raw";
	import sendIcon from "$playground/icons/send.svg?raw";
</script>

<div class="panel">
	<header>
		<button type="button" class="back" aria-label="Back">{@html chevronLeftIcon}</button>
		<div class="heading">
			<span class="title">Chat Support</span>
			<span class="status">
				<span class="dot"></span>
				Online — typically replies in a few minutes
			</span>
		</div>
	</header>
	<div class="messages"></div>
	<footer>
		<input type="text" placeholder="Message" />
		<button type="button" class="send" aria-label="Send">{@html sendIcon}</button>
	</footer>
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		height: 420px;
		font-family: system-ui, sans-serif;
	}
	header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-bottom: 1px solid #2c2c2e;
	}
	.back {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		margin-left: -8px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.heading {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.title {
		font-size: 14px;
		font-weight: 600;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #8e8e93;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #30d158;
		flex-shrink: 0;
	}
	.messages {
		flex: 1;
	}
	footer {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
	}
	input {
		flex: 1;
		min-width: 0;
		height: 44px;
		box-sizing: border-box;
		padding: 0 18px;
		border: none;
		border-radius: 9999px;
		background: #2c2c2e;
		color: #ffffff;
		font-size: 14px;
		outline: none;
	}
	.send {
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		border: none;
		border-radius: 50%;
		background: #ffffff;
		color: #000000;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.send :global(svg) {
		width: 18px;
		height: 18px;
	}
</style>
