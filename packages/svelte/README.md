# @hyperplexed/bubbles-svelte

Svelte 5 wrapper for [`@hyperplexed/bubbles`](https://github.com/githyperplexed/bubbles/tree/main/packages/core) — Android-style floating, draggable, expandable overlay bubbles, expressed as declarative components.

```sh
npm install @hyperplexed/bubbles-svelte
```

## Usage

```svelte
<script lang="ts">
	import { Bubble, Bubbles } from "@hyperplexed/bubbles-svelte";
	import Avatar from "./avatar.svelte";
	import ChatPanel from "./chat-panel.svelte";

	let showChat = $state(true);
</script>

<Bubbles theme="dark" side="left">
	{#if showChat}
		<Bubble id="chat" label="Chat" onDismiss={() => (showChat = false)}>
			{#snippet icon()}<Avatar />{/snippet}
			<ChatPanel />
		</Bubble>
	{/if}
</Bubbles>
```

- **`<Bubbles>`** owns a manager: props are the whole configuration (same options as [`createBubbles`](https://github.com/githyperplexed/bubbles/tree/main/packages/core#options), applied live on change; omitted props mean the defaults), and unmounting destroys the overlay. `onStateChange` / `onActiveChange` mirror the manager's events.
- **`<Bubble>`** declares presence: entering the markup adds the bubble, leaving removes it (animated), and prop changes apply in place. The `icon` snippet fills the collapsed circle; the children become the expanded panel. Whether a bubble has an icon/panel is decided when it mounts — but what the snippets _render_ stays fully reactive, and your app's context (theme, i18n, stores) flows into them.
- **`onDismiss`** fires when the _user_ dismisses the bubble (drag to the target, Delete key). The manager has already removed it; update your state so the `<Bubble>` leaves the markup too, as in the example above.
- **`onRejected`** fires when the add was refused because the manager is at `maxBubbles`.

## Reading state, and the escape hatch

Anywhere under `<Bubbles>`:

```svelte
<script lang="ts">
	import { getBubbles } from "@hyperplexed/bubbles-svelte";

	const bubbles = getBubbles();
</script>

{#if bubbles.state === "open"}<div class="backdrop"></div>{/if}
<button onclick={() => bubbles.manager.toggle()}>Toggle bubbles</button>
```

`state` and `active` are reactive mirrors of the manager's `statechange`/`activechange` events; `manager` is the full imperative API from the core — `activate()`, `toggle()`, `registerTrigger()`, `on()`, everything documented in the [core README](https://github.com/githyperplexed/bubbles/tree/main/packages/core#api).

## SSR

Safe by construction: creating a manager touches no DOM, and bubbles mount from effects, which never run on the server. `<Bubbles>` renders nothing itself (SvelteKit needs no `browser` guards).

## License

[MIT](LICENSE)
