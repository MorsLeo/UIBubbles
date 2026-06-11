export interface BubbleOptions {
	/** Unique id for this bubble. */
	id: string;
	/** Content shown inside the collapsed bubble (e.g. an avatar). */
	icon?: HTMLElement;
	/** Content shown in the expanded panel. */
	content?: HTMLElement;
}

export type BubbleSide = "left" | "right";

/** Internal per-bubble record kept by the manager. */
export interface BubbleInstance {
	el: HTMLElement;
	/** Removes this bubble's window listeners. */
	unwatch: () => void;
}

export interface BubbleManager {
	add(options: BubbleOptions): void;
	remove(id: string): void;
	destroy(): void;
}

/** Velocity in px/s. */
export interface Velocity {
	x: number;
	y: number;
}

export interface VelocityTracker {
	/** Records a pointer position at a timestamp (ms). */
	addSample(x: number, y: number, time: number): void;
	/** Velocity over the recent sample window, as of `now` (ms). */
	getVelocity(now: number): Velocity;
	/** Clears all samples (call on drag start). */
	reset(): void;
}
