<script lang="ts">
	import type { BubbleSlot, PanelLength } from "@hyperplexed/bubbles";
	import { getAllContexts, mount, onDestroy, unmount, untrack, type Snippet } from "svelte";
	import { getBubbles } from "./context";
	import SnippetHost from "./SnippetHost.svelte";

	interface Props {
		/** Unique id for this bubble. */
		id: string;
		/** Accessible name for the bubble and its panel, e.g. "Chat support". */
		label?: string;
		/**
		 * Content of the collapsed bubble circle (e.g. an avatar). Defaults
		 * to the core's ellipsis glyph. Whether a bubble has an icon/panel is
		 * decided when it mounts; what the snippet renders stays reactive.
		 */
		icon?: Snippet;
		/** Content of the expanded panel. Without it the bubble has no panel. */
		children?: Snippet;
		/** Overrides the manager's `panelWidth` for this bubble's panel. */
		panelWidth?: PanelLength;
		/** Overrides the manager's `panelMaxHeight` for this bubble's panel. */
		panelMaxHeight?: PanelLength;
		/**
		 * The user dismissed the bubble. The manager has already removed it,
		 * but this component still declares it — remove the <Bubble> from
		 * your markup here to keep the two in step.
		 */
		onDismiss?: () => void;
		/** The add was refused: the manager is at `maxBubbles`. */
		onRejected?: () => void;
	}

	let { id, label, icon, children, panelWidth, panelMaxHeight, onDismiss, onRejected }: Props =
		$props();

	const bubbles = getBubbles();
	// Captured at init so content mounted into the manager's host elements
	// keeps the app's context chain (theme, i18n, this wrapper's own).
	const contexts = getAllContexts();

	// Snippets render through hosts mounted once per bubble; these $state
	// props are how later snippet values reach them. The host element is
	// fixed for the bubble's life — what's inside stays live. Seeded empty
	// on purpose: the pre-effect assigns before the add effect below can
	// mount a host.
	const iconProps = $state<{ snippet: Snippet | undefined }>({ snippet: undefined });
	const contentProps = $state<{ snippet: Snippet | undefined }>({ snippet: undefined });
	$effect.pre(() => {
		iconProps.snippet = icon;
		contentProps.snippet = children;
	});

	const slot =
		(props: { snippet: Snippet | undefined }): BubbleSlot =>
		(host) => {
			const instance = mount(SnippetHost, { target: host, props, context: contexts });
			return () => unmount(instance);
		};

	// Presence is declarative: entering the markup adds the bubble, leaving
	// removes it (animated). Prop changes rerun the add; the manager
	// refreshes label/onDismiss/sizing in place without remounting slots.
	let mountedId: string | undefined;
	$effect(() => {
		if (mountedId !== undefined && mountedId !== id) bubbles.manager.remove(mountedId);
		mountedId = id;
		const added = bubbles.manager.add({
			id,
			label,
			icon: icon ? slot(iconProps) : undefined,
			content: children ? slot(contentProps) : undefined,
			panelWidth,
			panelMaxHeight,
			onDismiss: () => onDismiss?.()
		});
		if (!added) untrack(() => onRejected?.());
	});

	onDestroy(() => {
		if (mountedId !== undefined) bubbles.manager.remove(mountedId);
	});
</script>
