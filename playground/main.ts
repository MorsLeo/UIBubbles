import ChatPanel from "$playground/components/chat-panel.svelte";
import { createBubbles } from "$src/index";
import { mount } from "svelte";

const manager = createBubbles();

// The library takes a plain HTMLElement — any framework portals into it.
const content = document.createElement("div");
mount(ChatPanel, { target: content });

manager.add({ id: "demo", content });
