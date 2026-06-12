import { mount, type Component } from "svelte";

// The library takes plain HTMLElements; display: contents keeps the
// mounted component the real layout participant.
export const mountInto = (component: Component, props?: Record<string, unknown>): HTMLElement => {
	const holder = document.createElement("div");
	holder.style.display = "contents";
	mount(component, { target: holder, props });
	return holder;
};
