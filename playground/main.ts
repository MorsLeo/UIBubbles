import Cards from "$playground/components/cards.svelte";
import { createBubbles } from "$src/index";
import { mount } from "svelte";
import "$playground/app.css";

const manager = createBubbles();

mount(Cards, { target: document.body, props: { manager } });
