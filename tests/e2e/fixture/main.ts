import { createBubbles } from "$src/index";
import type { BubbleManager, BubbleOptions, BubblesOptions } from "$src/types";

/**
 * The fixture's control surface, exposed on `window.bubbles` so Playwright
 * can drive the library from `page.evaluate`. Content elements can't cross
 * the evaluate boundary, so `add` takes a `panelText` string and builds the
 * panel content here instead.
 */

// rAF leak detector — wrap before the library schedules its first frame so
// every animation loop is counted. `liveFrames()` is the number of frames
// currently pending; an idle, torn-down overlay must settle to zero, which
// turns an orphaned simulation into a test failure.
const liveFrames = new Set<number>();
const rawRaf = window.requestAnimationFrame.bind(window);
const rawCaf = window.cancelAnimationFrame.bind(window);
window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
	const id = rawRaf((t) => {
		liveFrames.delete(id);
		cb(t);
	});
	liveFrames.add(id);
	return id;
};
window.cancelAnimationFrame = (id: number): void => {
	liveFrames.delete(id);
	rawCaf(id);
};

type Logged = { event: string; detail: unknown };

const EVENT_NAMES = ["statechange", "activechange", "add", "dismiss", "remove"] as const;

let manager: BubbleManager | null = null;
const events: Logged[] = [];

window.bubbles = {
	create(options) {
		manager?.destroy();
		events.length = 0;
		manager = createBubbles(options);
		for (const name of EVENT_NAMES) {
			manager.on(name, (detail) => events.push({ event: name, detail }));
		}
	},
	add({ panelText, ...rest }) {
		const options: BubbleOptions = { ...rest };
		if (panelText !== undefined) {
			const content = document.createElement("div");
			content.textContent = panelText;
			content.dataset.panelContent = rest.id;
			options.content = content;
		}
		return manager!.add(options);
	},
	remove: (id) => manager!.remove(id),
	activate: (id) => manager!.activate(id),
	toggle: () => manager!.toggle(),
	configure: (options) => manager!.configure(options),
	state: () => manager!.state(),
	active: () => manager!.active(),
	destroy() {
		manager?.destroy();
		manager = null;
	},
	events: () => events.slice(),
	clearEvents: () => {
		events.length = 0;
	},
	liveFrames: () => liveFrames.size
};

declare global {
	interface Window {
		bubbles: {
			create(options?: BubblesOptions): void;
			add(options: BubbleOptions & { panelText?: string }): boolean;
			remove(id: string): void;
			activate(id: string): void;
			toggle(): void;
			configure(options: BubblesOptions): void;
			state(): "docked" | "open";
			active(): string | undefined;
			destroy(): void;
			events(): Logged[];
			clearEvents(): void;
			liveFrames(): number;
		};
	}
}
