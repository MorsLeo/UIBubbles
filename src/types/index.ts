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
	/** Tears down listeners, panel, and any running animation. */
	cleanup: () => void;
}

/** Shows and hides a bubble's expanded content panel. */
export interface PanelController {
	/** Opens the panel (no-op if already open); it follows its bubble while visible. */
	show(): void;
	hide(): void;
	destroy(): void;
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

/** Position + velocity of a single axis during simulation. */
export interface AxisState {
	position: number;
	velocity: number;
}

/** A point the bubble can glide to. */
export interface GlideTarget {
	left: number;
	top: number;
}

export interface GlideHooks {
	/** Runs every simulation frame, after the element's position is written. */
	onFrame?: () => void;
	/** Fires only on natural arrival at the target. */
	onRest?: () => void;
}

export interface DragHooks {
	/** Press released within the tap dead zone. */
	onTap?: () => void;
	/** Pointer left the dead zone and a real drag began. */
	onDragStart?: () => void;
	/** Return true to take over the release and suppress the throw. */
	onDragEnd?: () => boolean;
}

/** Toggles a bubble between its docked spot and the active (top center) spot. */
export interface ActivationController {
	toggle(): void;
	/** Drag began: stops any glide; the active state survives the drag. */
	onDragStart(): void;
	/** Handles release of an active bubble (returns it to top center). True when handled. */
	onDragEnd(): boolean;
	/** Cancels any glide and clears the active state without a return trip. */
	interrupt(): void;
}

export interface VelocityTracker {
	/** Records a pointer position at a timestamp (ms). */
	addSample(x: number, y: number, time: number): void;
	/** Velocity over the recent sample window, as of `now` (ms). */
	getVelocity(now: number): Velocity;
	/** Clears all samples (call on drag start). */
	reset(): void;
}
