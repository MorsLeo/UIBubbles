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
    /** Stroke of the built-in ellipsis glyph (shown when a bubble has no `icon`). */
    bubbleIcon: string;
    /** Drop shadow under each bubble. */
    bubbleShadow: string;
    /** Ring marking the focused bubble. */
    focusRing: string;
    /** Fill of the expanded panel and its caret. */
    panelSurface: string;
    /** Default text color inside the panel. */
    panelText: string;
    /** Drop shadow under the panel. */
    panelShadow: string;
    /** Unused in this fork (user dismissal is removed); kept for API compatibility. */
    dismissSurface: string;
    /** Unused in this fork (user dismissal is removed); kept for API compatibility. */
    dismissBorder: string;
    /** Unused in this fork (user dismissal is removed); kept for API compatibility. */
    dismissIcon: string;
}
/**
 * A panel dimension: a bare number is CSS pixels, or a `"<n>px"` / `"<n>%"`
 * string. The template-literal members give TypeScript callers
 * compile-time checking; values arriving from untyped JavaScript are
 * validated at the API boundary. Percentages resolve against the viewport
 * live, so a `"%"` value tracks resizes without a reconfigure — while the
 * viewport still caps the result either way.
 */
export type PanelLength = number | `${number}px` | `${number}%`;
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
    /** Expanded panel width in px or `"%"`; the viewport still caps it. Default 480. */
    panelWidth?: PanelLength;
    /** Cap on the panel height in px or `"%"`; the viewport still caps it. */
    panelMaxHeight?: PanelLength;
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
    panelWidth: PanelLength;
    panelMaxHeight?: PanelLength;
    maxBubbles: number;
    ricochet: number;
    initialState: BubblesState;
}
/**
 * A bubble's icon or panel content. Either a ready `HTMLElement`, or a
 * render callback handed a fresh host element to populate — return a
 * teardown (e.g. a framework `unmount`) and the manager runs it when the
 * bubble is removed or the manager is destroyed. The callback
 * form spares framework consumers from creating a host element and
 * tracking the unmount themselves.
 */
export type BubbleSlot = HTMLElement | ((host: HTMLElement) => void | (() => void));
export interface BubbleOptions {
    /** Unique id for this bubble. */
    id: string;
    /**
     * Accessible name for the bubble (and its panel), e.g. "Chat support".
     * The icon is opaque to assistive tech, so without a label the bubble
     * announces as a generic button.
     */
    label?: string;
    /**
     * Content shown inside the collapsed bubble (e.g. an avatar) — an
     * element or a render callback (see `BubbleSlot`). Defaults to an
     * ellipsis glyph.
     */
    icon?: BubbleSlot;
    /**
     * Content shown in the expanded panel — an element or a render callback
     * (see `BubbleSlot`). Without it the bubble has no panel.
     */
    content?: BubbleSlot;
    /** Overrides the manager's `panelWidth` for this bubble's panel. */
    panelWidth?: PanelLength;
    /** Overrides the manager's `panelMaxHeight` for this bubble's panel. */
    panelMaxHeight?: PanelLength;
    /**
     * Never called in this fork — user dismissal is removed, so bubbles
     * only leave via remove()/destroy(). Kept for API compatibility.
     */
    onDismiss?: () => void;
}
export type BubbleSide = "left" | "right";
/**
 * The flock's two arrangements: "docked" stacks the bubbles on a screen
 * edge; "open" spreads them into the top row with a panel showing.
 */
export type BubblesState = "docked" | "open";
export type ArrowDirection = "left" | "right" | "up" | "down";
/**
 * Why a bubble left. In this fork every removal is "programmatic" —
 * user dismissal is removed; "user" survives for API compatibility.
 */
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
    statechange: {
        state: BubblesState;
    };
    /**
     * active() changed — the bubble whose panel shows while open, and
     * the one that leads when the group next opens. `id` is undefined
     * once no bubbles remain.
     */
    activechange: {
        id: string | undefined;
    };
    /** A bubble was mounted by add(). Re-adds and reclaims don't fire it. */
    add: {
        id: string;
    };
    /**
     * Never fired in this fork — user dismissal is removed, so there is
     * no gesture that commits one. Kept for API compatibility.
     */
    dismiss: {
        id: string;
    };
    /**
     * A bubble finished leaving — fired once it's fully gone, after any
     * exit animation. A removal reversed by a re-add never fires it.
     */
    remove: {
        id: string;
        reason: BubbleRemoveReason;
    };
}
/** Internal per-bubble record kept by the manager. */
export interface BubbleInstance {
    el: HTMLElement;
    panel?: PanelController;
    /** Per-bubble panel sizing overrides; they win over the manager's. */
    panelWidth?: PanelLength;
    panelMaxHeight?: PanelLength;
    /** Teardowns from render-callback slots (icon, content); run on removal. */
    teardowns?: Array<() => void>;
}
/** The repaintable parts of a panel's look. */
export interface PanelAppearance {
    theme: BubbleTheme;
    width: PanelLength;
    maxHeight?: PanelLength;
}
/** Shows and hides a bubble's expanded content panel. */
export interface PanelController {
    /** Opens the panel (no-op if already open); it follows the group while visible. */
    show(): void;
    hide(): void;
    /** Repaints colors and sizing in place, open or closed. */
    setAppearance(appearance: PanelAppearance): void;
    /** True if the node is the panel or lives inside it — for outside-click tests. */
    contains(node: Node | null): boolean;
    destroy(): void;
}
export interface BubbleManager {
    /**
     * True when the bubble is present after the call — newly added,
     * already mounted, or reclaimed mid-removal. False only when the
     * manager is at maxBubbles and the request was ignored. Re-adding a
     * mounted id refreshes `label` and the panel sizing overrides in
     * place; the element, icon, and content live on.
     */
    add(options: BubbleOptions): boolean;
    remove(id: string): void;
    /**
     * Applies new options to the live manager — no remounting, no
     * re-entry animations. Theme and colors repaint every bubble and
     * panel in place; panel sizing reflows open panels;
     * maxBubbles governs future add() calls (a lower cap never evicts
     * live bubbles). `side` and `vertical` describe where a fresh flock
     * docks, so they take effect once every bubble is gone and the next
     * one enters. Omitted options return to their defaults. Elements the
     * consumer supplied (icon, content) are theirs to restyle. A call
     * that resolves to the applied configuration is a guaranteed no-op,
     * so props-driven consumers can call this on every render.
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
     * Marks an element as a trigger — one of your own controls that opens
     * or switches bubbles (a launcher button, a menu item). A press inside
     * it is exempt from tap-away, so the press can't collapse the flock a
     * fraction before your handler reopens it. Returns a function that
     * unregisters the element. The library's own bubbles are always exempt;
     * this is only for controls living outside the flock.
     */
    registerTrigger(el: HTMLElement): () => void;
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
     * positioning — the drag then only reports pointer moves, never
     * writing the element's position.
     */
    onDragStart?: (x: number, y: number, coarse: boolean) => boolean | void;
    /** Pointer moved during a taken-over drag. */
    onDragMove?: (x: number, y: number) => void;
    /** Return true to take over the release and suppress the throw. */
    onDragEnd?: (velocity: Velocity) => boolean;
}
/** A bubble as the group controller sees it. */
export interface GroupMember {
    id: string;
    el: HTMLElement;
    panel?: PanelController;
}
export interface GroupCallbacks {
    /**
     * The group's arrangement or active member changed. Carries no
     * payload: the manager diffs its own observable values at delivery
     * time, which also covers changes the group can't see (teardown
     * reverting state() to the configured initialState).
     */
    onChange(): void;
}
/** Where the open row rests: the row's horizontal center and its top edge. */
export interface RowAnchor {
    centerX: number;
    top: number;
}
/**
 * Coordinates all bubbles: docked stacking, trail drags, group flings,
 * and routing of taps/drags from individual bubbles.
 */
export interface BubbleGroup {
    addMember(member: GroupMember): void;
    removeMember(id: string): void;
    /** Centroid of the docked members (x center, top and bottom edges) — panels hang off it. */
    attachPoint(): {
        x: number;
        top: number;
        bottom: number;
    } | undefined;
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
    /**
     * A pointerdown landing outside the open flock and its panel collapses
     * the group (tap-away). A no-op while docked or when the press is on a
     * bubble or inside the panel. Never consumes the event.
     */
    onOutsidePointer(target: EventTarget | null): void;
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
export interface VelocityTracker {
    /** Records a pointer position at a timestamp (ms). */
    addSample(x: number, y: number, time: number): void;
    /** Velocity over the recent sample window, as of `now` (ms). */
    getVelocity(now: number): Velocity;
    /** Clears all samples (call on drag start). */
    reset(): void;
}
//# sourceMappingURL=index.d.ts.map