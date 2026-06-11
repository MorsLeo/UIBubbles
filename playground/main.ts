import ChatPanel from "$playground/components/chat-panel.svelte";
import { createBubbles } from "$src/index";
import { mount } from "svelte";
import "$playground/app.css";

const manager = createBubbles();

// The library takes a plain HTMLElement — any framework portals into it.
// display: contents removes the mount wrapper from layout, so the
// component root participates directly in the panel's flex column.
const createChatContent = (): HTMLElement => {
	const content = document.createElement("div");
	content.style.display = "contents";
	mount(ChatPanel, { target: content });
	return content;
};

const hint = document.getElementById("hint");
let spawned = false;

const setSpawned = (value: boolean) => {
	spawned = value;
	if (hint) hint.style.opacity = spawned ? "0" : "1";
};

document.addEventListener("click", (event) => {
	if (spawned) return;

	// Only bare-background clicks spawn; the bubble, panel, and hint
	// (pointer-events: none) never reach this check.
	if (event.target !== document.body && event.target !== document.documentElement) return;

	manager.add({
		id: "demo",
		content: createChatContent(),
		onDismiss: () => setSpawned(false)
	});
	setSpawned(true);
});
