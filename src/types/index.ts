export interface BubbleOptions {
	/** Unique id for this bubble. */
	id: string;
	/** Content shown inside the collapsed bubble (e.g. an avatar). */
	icon?: HTMLElement;
	/** Content shown in the expanded panel. */
	content?: HTMLElement;
	/** Fires after the user dismisses the bubble via the removal target. */
	onDismiss?: () => void;
}

export type BubbleSide = "left" | "right";

/** Internal per-bubble record kept by the manager. */
export interface BubbleInstance {
	el: HTMLElement;
	/** Consumer callback for user-initiated dismissal. */
	onDismiss?: () => void;
	/** Tears down listeners, panel, and any running animation. */
	cleanup: () => void;
}

/** Shows and hides a bubble's expanded content panel. */
export interface PanelController {
	/** Opens the panel (no-op if already open); it follows the group while visible. */
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
	/** Starting velocity (px/s) — seeds a fast launch with the spring's long settling tail. */
	initialVelocity?: Velocity;
	/** Runs every simulation frame, after the element's position is written. */
	onFrame?: () => void;
	/** Fires only on natural arrival at the target. */
	onRest?: () => void;
}

export interface DragHooks {
	/** Press released within the tap dead zone. */
	onTap?: () => void;
	/**
	 * Pointer left the dead zone and a real drag began. Return true to take
	 * over positioning — the drag then only reports pointer moves and keeps
	 * the dismiss target tracking, never writing the element's position.
	 */
	onDragStart?: (x: number, y: number) => boolean | void;
	/** Pointer moved during a taken-over drag. */
	onDragMove?: (x: number, y: number) => void;
	/** Return true to take over the release and suppress the throw. */
	onDragEnd?: (velocity: Velocity) => boolean;
	/** Released while captured by the dismiss target. */
	onDismiss?: () => void;
}

/** A bubble as the group controller sees it. */
export interface GroupMember {
	id: string;
	el: HTMLElement;
	panel?: PanelController;
}

export interface GroupCallbacks {
	/** Dismiss one bubble (fires its consumer onDismiss). */
	remove(id: string): void;
	/** Dismiss every bubble (group dragged onto the removal target). */
	removeAll(): void;
}

/**
 * Coordinates all bubbles: docked stacking, trail drags, group flings,
 * and routing of taps/drags/dismissals from individual bubbles.
 */
export interface BubbleGroup {
	addMember(member: GroupMember): void;
	removeMember(id: string): void;
	/** Centroid of the docked members (x center, bottom edge) — panels hang below it. */
	attachPoint(): { x: number; bottom: number } | undefined;
	/** Animates the bubble off-screen, then calls `onGone` (programmatic removal). */
	retireMember(id: string, onGone: () => void): void;
	/** Reverses an in-flight retirement; true if the member was retiring. */
	restoreMember(id: string): boolean;
	onTap(id: string): void;
	/** True when the group takes over the drag (docked trail drags). */
	onDragStart(id: string, x: number, y: number): boolean;
	onDragMove(x: number, y: number): void;
	onDragEnd(id: string, velocity: Velocity): boolean;
	onDismiss(id: string): void;
	handleResize(): void;
}

/** Chase simulations for a docked group drag: the leader rides the pointer, the rest chain behind. */
export interface DragTrail {
	/** Feeds the live pointer position — the leader's target. */
	setPointer(x: number, y: number): void;
	/** (Re)starts a member's chase; the leader chases the pointer, others chain toward it. */
	chase(member: GroupMember, leaderId: string): void;
	cancel(id: string): void;
	cancelAll(): void;
}

/** Group-wide hover/press visuals: the docked stack scales as one control. */
export interface GroupFeedback {
	setHover(hovered: boolean): void;
	setPressed(pressed: boolean): void;
	/** Wires a member element's pointer events to the group-wide state. */
	attach(el: HTMLElement): void;
}

/** Drives the bubble while the dismiss target holds it, or while it escapes back to the pointer. */
export interface CaptureFollower {
	/** Feed pointer positions; true while capture/escape owns the bubble's position. */
	update(x: number, y: number): boolean;
	/** Stops whichever simulation is running (release or drag end). */
	cancel(): void;
}

/** The drag-to-dismiss target shown while a bubble is dragged. */
export interface DismissZone {
	/** Animates the target in from off-screen bottom (call at drag start). */
	show(): void;
	/** Updates capture from the pointer position; true while captured. */
	track(x: number, y: number): boolean;
	captured(): boolean;
	/** True from a captured release until the exit animation finishes. */
	dismissing(): boolean;
	/** Center of the target circle in viewport coordinates. */
	center(): { x: number; y: number };
	/** Animates the target back off-screen (call at release). `onHidden` fires once it's gone. */
	hide(onHidden?: () => void): void;
	destroy(): void;
}

export interface VelocityTracker {
	/** Records a pointer position at a timestamp (ms). */
	addSample(x: number, y: number, time: number): void;
	/** Velocity over the recent sample window, as of `now` (ms). */
	getVelocity(now: number): Velocity;
	/** Clears all samples (call on drag start). */
	reset(): void;
}
