import { mount, type Component } from "svelte";

// The library takes plain HTMLElements; display: contents keeps the
// mounted component the real layout participant.
export const mountInto = <Props extends Record<string, any>>(
	component: Component<Props>,
	props?: Props
): HTMLElement => {
	const holder = document.createElement("div");
	holder.style.display = "contents";
	// The cast covers the prop-less call shape; mount() itself wants
	// props present whenever Props has required members.
	mount(component, { target: holder, props: props as Props });
	return holder;
};
