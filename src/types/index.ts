/**
 * Preset color schemes, named for the host page they suit: "dark" pairs
 * a bright bubble with a dark panel, "light" the inverse.
 */
export type BubbleThemeName = "dark" | "light";

/**
 * Every color the library paints with. Consumers usually pick a preset
 * by name and override individual tokens via `colors`.
 */
export interface BubbleTheme {
	/** Fill of the collapsed bubble circle. */
	bubbleSurface: string;
	/** Stroke of the built-in chat glyph (shown when a bubble has no `icon`). */
	bubbleIcon: string;
	/** Drop shadow under each bubble. */
	bubbleShadow: string;
	/** Ring marking the keyboard-focused bubble. */
	focusRing: string;
	/** Fill of the expanded panel and its caret. */
	panelSurface: string;
	/** Default text color inside the panel. */
	panelText: string;
	/** Drop shadow under the panel. */
	panelShadow: string;
	/** Fill of the drag-to-dismiss target circle. */
	dismissSurface: string;
	/** Border of the drag-to-dismiss target circle. */
	dismissBorder: string;
	/** Stroke of the X glyph inside the dismiss target. */
	dismissIcon: string;
}

/** Manager-wide configuration; every field is optional. */
export interface BubblesOptions {
	/**
	 * Preset color scheme. "auto" (the default) follows the browser's
	 * prefers-color-scheme, tracking changes live.
	 */
	theme?: BubbleThemeName | "auto";
	/** Per-token overrides applied on top of the preset. */
	colors?: Partial<BubbleTheme>;
	/** Screen edge the docked stack starts on. Default "right". */
	side?: BubbleSide;
	/**
	 * Vertical center of the docked stack as a fraction of the viewport
	 * height (0 = top, 1 = bottom), clamped to the screen margins.
	 * Default 0.5.
	 */
	vertical?: number;
	/** Expanded panel width in px; the viewport still caps it. Default 480. */
	panelWidth?: number;
	/** Cap on the panel height in px; the viewport still caps it. */
	panelMaxHeight?: number;
	/** Most bubbles the manager will hold; add() returns false beyond it. Default 5. */
	maxBubbles?: number;
	/**
	 * Fraction of speed a flung bubble keeps when it bounces off the
	 * top/bottom screen gap — 0 stops dead, 1 is lossless. Clamped to
	 * 0–1. Default 0.4.
	 */
	ricochet?: number;
	/**
	 * The state a fresh flock enters in. "open" drops every entering
	 * bubble straight into its row slot — there is no dock-then-rise
	 * transition. Default "docked".
	 */
	initialState?: BubblesState;
}

/**
 * BubblesOptions with every default applied. The theme stays a choice
 * (not tokens) because "auto" resolves against the OS preference at
 * paint time.
 */
export interface ResolvedBubblesOptions {
	theme: BubbleThemeName | "auto";
	colors?: Partial<BubbleTheme>;
	side: BubbleSide;
	vertical: number;
	panelWidth: number;
	panelMaxHeight?: number;
	maxBubbles: number;
	ricochet: number;
	initialState: BubblesState;
}

export interface BubbleOptions {
	/** Unique id for this bubble. */
	id: string;
	/**
	 * Accessible name for the bubble (and its panel), e.g. "Chat support".
	 * The icon is opaque to assistive tech, so without a label the bubble
	 * announces as a generic button.
	 */
	label?: string;
	/** Content shown inside the collapsed bubble (e.g. an avatar). */
	icon?: HTMLElement;
	/** Content shown in the expanded panel. */
	content?: HTMLElement;
	/** Overrides the manager's `panelWidth` for this bubble's panel. */
	panelWidth?: number;
	/** Overrides the manager's `panelMaxHeight` for this bubble's panel. */
	panelMaxHeight?: number;
	/** Fires after the user dismisses the bubble via the removal target. */
	onDismiss?: () => void;
}

export type BubbleSide = "left" | "right";

/**
 * The flock's two arrangements: "docked" stacks the bubbles on a screen
 * edge; "open" spreads them into the top row with a panel showing.
 */
export type BubblesState = "docked" | "open";

export type ArrowDirection = "left" | "right" | "up" | "down";

/** Why a bubble left: the user dismissed it, or the consumer removed it. */
export type BubbleRemoveReason = "user" | "programmatic";

/**
 * Everything the manager announces, with each event's payload.
 *
 * Delivery is deferred to a microtask after the triggering call, so
 * handlers always observe the manager in a settled state. statechange
 * and activechange report net changes — a value that flickers and
 * returns within one tick (a re-add reversing a removal, an emptying
 * flock passing through "docked") announces nothing.
 */
export interface BubbleEvents {
	/**
	 * state() changed. Semantic, not animated: it fires when the
	 * arrangement changes, not when bubbles finish flying to it. While
	 * no bubbles are mounted, state() reports the configured
	 * initialState — the value this event tracks.
	 */
	statechange: { state: BubblesState };
	/**
	 * active() changed — the bubble whose panel shows while open, and
	 * the one that leads when the group next opens. `id` is undefined
	 * once no bubbles remain.
	 */
	activechange: { id: string | undefined };
	/** A bubble was mounted by add(). Re-adds and reclaims don't fire it. */
	add: { id: string };
	/**
	 * The user committed to dismissing a bubble — released it on the
	 * removal target, or pressed Delete — fired the instant they commit,
	 * before the exit animation. Only user gestures fire it (never
	 * programmatic remove()/destroy()), and every dismiss is followed by
	 * a remove with reason "user" for the same id once the bubble is
	 * gone. Dragging the whole docked group onto the target fires one
	 * dismiss per bubble. React here for snappy UI: the matching remove
	 * lags behind the fly-off, this doesn't.
	 */
	dismiss: { id: string };
	/**
	 * A bubble finished leaving — fired once it's fully gone, after any
	 * exit animation. A removal reversed by a re-add never fires it.
	 * The bubble's own onDismiss callback runs synchronously at the
	 * dismissal, so it precedes this event.
	 */
	remove: { id: string; reason: BubbleRemoveReason };
}

/** Internal per-bubble record kept by the manager. */
export interface BubbleInstance {
	el: HTMLElement;
	panel?: PanelController;
	/** Per-bubble panel sizing overrides; they win over the manager's. */
	panelWidth?: number;
	panelMaxHeight?: number;
	/** Consumer callback for user-initiated dismissal. */
	onDismiss?: () => void;
}

/** The repaintable parts of a panel's look. */
export interface PanelAppearance {
	theme: BubbleTheme;
	width: number;
	maxHeight?: number;
}

/** Shows and hides a bubble's expanded content panel. */
export interface PanelController {
	/** Opens the panel (no-op if already open); it follows the group while visible. */
	show(): void;
	hide(): void;
	/** Repaints colors and sizing in place, open or closed. */
	setAppearance(appearance: PanelAppearance): void;
	destroy(): void;
}

export interface BubbleManager {
	/**
	 * True when the bubble is present after the call — newly added,
	 * already mounted, or reclaimed mid-dismissal. False only when the
	 * manager is at maxBubbles and the request was ignored. Re-adding a
	 * mounted id refreshes `label`, `onDismiss`, and the panel sizing
	 * overrides in place; the element, icon, and content live on.
	 */
	add(options: BubbleOptions): boolean;
	remove(id: string): void;
	/**
	 * Applies new options to the live manager — no remounting, no
	 * re-entry animations. Theme and colors repaint every bubble, panel,
	 * and the dismiss target in place; panel sizing reflows open panels;
	 * maxBubbles governs future add() calls (a lower cap never evicts
	 * live bubbles). `side` and `vertical` describe where a fresh flock
	 * docks, so they take effect once every bubble is gone and the next
	 * one enters. Omitted options return to their defaults. Elements the
	 * consumer supplied (icon, content) are theirs to restyle.
	 */
	configure(options: BubblesOptions): void;
	/**
	 * The flock's current state. With no bubbles mounted, the state the
	 * next flock will enter in (the configured initialState).
	 */
	state(): BubblesState;
	/**
	 * The active bubble's id — the one whose panel shows while the
	 * group is open, and the one that leads when it next opens.
	 * undefined with no bubbles mounted.
	 */
	active(): string | undefined;
	/**
	 * Makes the bubble active: expands a docked group on it, or
	 * switches the open row's panel to it. Moves keyboard focus to the
	 * bubble, like toggle(). No-op for unknown ids, bubbles mid-removal
	 * (re-add() to reclaim those), an already-active bubble in an open
	 * group, and while the user is dragging — a live drag owns the group.
	 */
	activate(id: string): void;
	/**
	 * Subscribes to a manager event; returns the unsubscribe function.
	 * See BubbleEvents for the payloads and delivery timing.
	 */
	on<E extends keyof BubbleEvents>(event: E, handler: (detail: BubbleEvents[E]) => void): () => void;
	/**
	 * Expands or collapses the group, moving keyboard focus with it.
	 * Bind this to your own shortcut — the library ships no global
	 * hotkey, so it can never collide with the host page's.
	 */
	toggle(): void;
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
	 * Pointer left the dead zone and a real drag began. `coarse` is true
	 * for direct-contact pointers (touch/pen). Return true to take over
	 * positioning — the drag then only reports pointer moves and keeps
	 * the dismiss target tracking, never writing the element's position.
	 */
	onDragStart?: (x: number, y: number, coarse: boolean) => boolean | void;
	/** Pointer moved during a taken-over drag. */
	onDragMove?: (x: number, y: number) => void;
	/** Return true to take over the release and suppress the throw. */
	onDragEnd?: (velocity: Velocity) => boolean;
	/**
	 * Released while captured by the dismiss target — the commit. Fires
	 * synchronously, before the bubble rides the target off-screen, so
	 * consumers can react the instant the user lets go.
	 */
	onDismissCommit?: () => void;
	/** The off-screen ride is done; the bubble can be removed now. */
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
	/**
	 * The user just committed to dismissing this bubble (capture release
	 * or Delete), before the exit. Announce-only — removal still runs its
	 * own path when the exit finishes.
	 */
	dismissed(id: string): void;
	/**
	 * The group's arrangement or active member changed. Carries no
	 * payload: the manager diffs its own observable values at delivery
	 * time, which also covers changes the group can't see (teardown
	 * reverting state() to the configured initialState).
	 */
	onChange(): void;
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
	/**
	 * Open row: left/right move focus. Docked: arrows reposition the
	 * stack — up/down scoot it (all the way with `toEnd`), left/right
	 * send it to the other edge.
	 */
	onArrow(id: string, direction: ArrowDirection, toEnd: boolean): void;
	/** Collapses the open group and returns focus to the docked stack. */
	onEscape(): void;
	/** Dismisses an open-row bubble, moving focus to its neighbor. */
	onDelete(id: string): void;
	/** Expands or collapses the group, moving keyboard focus with it. */
	toggle(): void;
	/** The group's current arrangement. */
	state(): BubblesState;
	/** The active member's id — the shown panel when open, the next leader when docked. */
	active(): string | undefined;
	/** Makes the member active: expands a docked group on it, switches an open row to it. */
	activate(id: string): void;
	/** True when the group takes over the drag (docked trail drags). */
	onDragStart(id: string, x: number, y: number, coarse: boolean): boolean;
	onDragMove(x: number, y: number): void;
	onDragEnd(id: string, velocity: Velocity): boolean;
	/** The user committed to dismissing (capture release): announce the leaving set. */
	onDismissCommit(id: string): void;
	onDismiss(id: string): void;
	handleResize(): void;
}

/** Chase simulations for a docked group drag: the leader rides the pointer, the rest chain behind. */
export interface DragTrail {
	/** Feeds the live pointer position — the leader's target. */
	setPointer(x: number, y: number): void;
	/** Time-scale for the chase springs (1 = stock feel); set per drag. */
	setRate(rate: number): void;
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
	/** Repaints the target's colors in place. */
	setTheme(theme: BubbleTheme): void;
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
