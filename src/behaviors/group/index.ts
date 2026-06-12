import { clampTop } from "$src/behaviors/clamp";
import { startFling } from "$src/behaviors/fling";
import { startGlide } from "$src/behaviors/glide";
import { createGroupFeedback } from "$src/behaviors/group/feedback";
import { clampCenter, dockFromLanding, dockSlot, rowSlot } from "$src/behaviors/group/layout";
import { createDragTrail } from "$src/behaviors/group/trail";
import { prefersReducedMotion } from "$src/behaviors/reduced-motion";
import { chooseSide } from "$src/behaviors/snap";
import { EDGE_MARGIN, Z_BUBBLE_TOP } from "$src/constants";
import { setBubbleHover, setBubblePressed } from "$src/elements/bubble";
import { TOUCH_CHASE_RATE } from "$src/physics/config";
import type {
	BubbleGroup,
	BubbleSide,
	BubblesState,
	DismissZone,
	GlideTarget,
	GroupCallbacks,
	GroupMember
} from "$src/types";
import { viewportHeight, viewportWidth } from "$src/viewport";

/** How close (px) a bubble must be to its row slot before its panel appears. */
const PANEL_APPEAR_DISTANCE = 100;

/** Initial speed (px/s) for entrances and exits — fast launch, long spring tail. */
const LAUNCH_SPEED = 2400;

/** Vertical distance (px) the docked stack scoots per arrow-key press. */
const DOCK_NUDGE = 80;

/**
 * Coordinates every bubble. Docked, they're a stack distributed around
 * a group-owned center: they drag together as a chained trail, fling
 * together, and dismiss together. Tapped open, they form a centered row
 * at the top with one member's panel showing — tap to switch panels,
 * tap the active bubble to collapse home. Row bubbles drag (and
 * dismiss) individually, returning to their slot on release.
 */
export const createBubbleGroup = (
	zone: DismissZone,
	callbacks: GroupCallbacks,
	config: {
		side: BubbleSide;
		vertical: number;
		initialState: BubblesState;
		/** Read at each fling, so configure() retunes it live. */
		ricochet: () => number;
	}
): BubbleGroup => {
	const members: GroupMember[] = [];
	const motions = new Map<string, () => void>();
	const retiring = new Set<string>();
	let mode: BubblesState = config.initialState;
	let side: BubbleSide = config.side;
	let centerY: number | undefined;
	let activeId: string | undefined;
	let groupDragging = false;
	let dragLeaderId: string | undefined;
	let flingLeaderId: string | undefined;
	let rowDraggingId: string | undefined;

	const byId = (id: string) => members.find((m) => m.id === id);

	/** Where the dock centers until an interaction teaches it otherwise. */
	const defaultCenterY = () => viewportHeight() * config.vertical;

	// All layout math sees only the docked members: a retiring bubble stops
	// counting the moment its exit starts, so the others redistribute
	// while it's still flying out.
	const docked = () => members.filter((m) => !retiring.has(m.id));

	// A group movement outlives the pointer: after a release the leader
	// flies on (the trail still chasing) until it lands and the group
	// settles. Membership changes during either phase must cooperate
	// with the movement instead of settling it out from under itself.
	const flightLeaderId = () => dragLeaderId ?? flingLeaderId;
	const groupInFlight = () => groupDragging || flingLeaderId !== undefined;

	const trail = createDragTrail(zone, docked);
	const feedback = createGroupFeedback(members, () => mode === "docked");

	const cancelMotion = (id: string) => {
		motions.get(id)?.();
		motions.delete(id);
	};

	const slotTargetFor = (member: GroupMember): GlideTarget =>
		mode === "open" ? rowSlot(member, docked()) : dockSlot(member, docked(), centerY, side);

	/** The grabbed bubble's landing teaches the group its new dock. */
	const adoptDockFrom = (member: GroupMember) => {
		({ side, centerY } = dockFromLanding(member, docked()));
	};

	const hideAllPanels = () => {
		for (const m of members) m.panel?.hide();
	};

	/**
	 * Reduced motion swaps an entrance's fly-in for a fade at the slot
	 * (the glide still snaps the position; opacity sells the arrival).
	 */
	const fadeInIfReduced = (el: HTMLElement) => {
		if (!prefersReducedMotion()) return;
		el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
	};

	/**
	 * Assistive-tech exposure mirroring the visual model: the docked
	 * stack reads as one control (only the topmost member is focusable
	 * and announced), the open row as one button per bubble. The whole
	 * group is a single tab stop — the stack's topmost member, or the
	 * row's active bubble — and arrow keys roam the rest of the row,
	 * so tab order never depends on DOM insertion order.
	 */
	const syncMembers = () => {
		const top = docked()[0];
		for (const m of members) {
			const hidden = retiring.has(m.id) || (mode === "docked" && m !== top);
			m.el.tabIndex = !hidden && (mode === "docked" || m.id === activeId) ? 0 : -1;
			if (hidden) m.el.setAttribute("aria-hidden", "true");
			else m.el.removeAttribute("aria-hidden");

			// Each bubble controls its own panel; expanded only while showing.
			m.el.setAttribute("aria-expanded", mode === "open" && m.id === activeId ? "true" : "false");
		}
	};

	/** Shows the active panel once its bubble is close enough to its slot. */
	const revealWhenNear = (member: GroupMember) => () => {
		if (mode !== "open" || member.id !== activeId) return;

		const slot = rowSlot(member, docked());
		const rect = member.el.getBoundingClientRect();
		if (Math.hypot(rect.left - slot.left, rect.top - slot.top) < PANEL_APPEAR_DISTANCE) {
			member.panel?.show();
		}
	};

	/** Paint order mirrors stack order: member index 0 (topmost) highest. */
	const syncZOrder = () => {
		members.forEach((m, i) => {
			m.el.style.zIndex = `${Z_BUBBLE_TOP - i}`;
		});
	};

	const settleMembers = () => {
		// Settling supersedes any in-flight throw.
		flingLeaderId = undefined;
		trail.cancelAll();
		syncZOrder();
		for (const m of members) {
			if (retiring.has(m.id) || m.id === rowDraggingId) continue;
			cancelMotion(m.id);
			motions.set(
				m.id,
				startGlide(m.el, () => slotTargetFor(m), {
					onFrame: revealWhenNear(m),
					onRest: () => motions.delete(m.id)
				})
			);
		}
	};

	/** Restarts a member's settle glide with launch velocity (entrances). */
	const seedMotion = (member: GroupMember, velocity: { x: number; y: number }) => {
		cancelMotion(member.id);
		motions.set(
			member.id,
			startGlide(member.el, () => slotTargetFor(member), {
				initialVelocity: velocity,
				onFrame: revealWhenNear(member),
				onRest: () => motions.delete(member.id)
			})
		);
	};

	const expand = () => {
		mode = "open";
		// The stack flies apart into the row — group-wide hover ends with it.
		feedback.setHover(false);
		activeId ??= docked()[0]?.id;
		syncMembers();
		settleMembers();
	};

	const collapse = () => {
		mode = "docked";
		centerY ??= defaultCenterY();
		hideAllPanels();

		// The active bubble leads the stack home: the most recently used
		// member becomes topmost. Reordering happens only here — switching
		// panels while open never shuffles the row.
		const i = activeId ? members.findIndex((m) => m.id === activeId) : -1;
		if (i > 0) members.unshift(...members.splice(i, 1));

		// After the reorder, so the new topmost is the one left exposed.
		syncMembers();
		settleMembers();
	};

	const switchTo = (member: GroupMember) => {
		hideAllPanels();
		activeId = member.id;
		syncMembers();
		member.panel?.show();
	};

	/** A departing active bubble hands its panel to the group's first remaining member. */
	const handOffActivePanel = (leavingId: string) => {
		if (activeId !== leavingId) return;

		activeId = docked().find((m) => m.id !== leavingId)?.id;
		syncMembers();
		const next = activeId ? byId(activeId) : undefined;
		if (mode === "open" && next) next.panel?.show();
	};

	/** A member appearing mid-flight (added or restored) joins the live trail. */
	const joinTrail = (member: GroupMember): boolean => {
		const leaderId = flightLeaderId();
		if (!groupInFlight() || !leaderId || leaderId === member.id) return false;
		trail.chase(member, leaderId);
		return true;
	};

	/** Off-screen left position just past the group's docked side. */
	const offscreenLeft = (el: HTMLElement) =>
		side === "left" ? -(el.offsetWidth + EDGE_MARGIN) : viewportWidth() + EDGE_MARGIN;

	return {
		// Panels position off the group, not any one bubble: below the
		// flock's centroid. At rest the open row is page-centered, so the
		// centroid IS the page center — one rule for the panel's whole
		// life, no positional handoffs to snap.
		attachPoint() {
			const flock = docked();
			if (flock.length === 0) return undefined;

			let x = 0;
			let bottom = 0;
			for (const m of flock) {
				const rect = m.el.getBoundingClientRect();
				x += rect.left + rect.width / 2;
				bottom += rect.bottom;
			}
			return { x: x / flock.length, bottom: bottom / flock.length };
		},

		addMember(member) {
			// Newest member sits first — top of the docked stack, far left of
			// the open row — and always becomes the active one.
			members.unshift(member);
			activeId = member.id;
			syncMembers();
			const el = member.el;
			feedback.attach(el);
			fadeInIfReduced(el);

			// Checked before the first-member entrance: a group born open
			// (initialState) receives even its first bubble straight into
			// the row — never docked-then-risen.
			if (mode === "open") {
				// Falls in from off-screen top into the far-left slot and takes
				// the active panel (revealed by its arrival); the row shifts over.
				el.style.left = `${rowSlot(member, docked()).left}px`;
				el.style.top = `${-(el.offsetHeight + EDGE_MARGIN)}px`;
				hideAllPanels();
				settleMembers();

				// Every entrant still above the viewport falls straight down:
				// x pinned to its current slot (invisible up there) and the
				// launch re-seeded — settling just stole it from earlier
				// same-tick entrants, which otherwise drift in at angles
				// while only the newest falls at full speed.
				for (const m of docked()) {
					if (m.el.getBoundingClientRect().bottom > 0) continue;
					m.el.style.left = `${rowSlot(m, docked()).left}px`;
					seedMotion(m, { x: 0, y: LAUNCH_SPEED });
				}
				return;
			}

			// The first bubble enters with the standard fling and teaches the
			// group its dock on landing.
			if (members.length === 1) {
				el.style.left = `${offscreenLeft(el)}px`;
				el.style.top = `${clampTop(el, defaultCenterY() - el.offsetHeight / 2)}px`;
				motions.set(
					member.id,
					startFling(el, { x: 0, y: 0 }, config.ricochet(), () => {
						motions.delete(member.id);
						adoptDockFrom(member);
					})
				);
				return;
			}

			// Joins the docked stack from off-screen on the group's side, at
			// slot height; everyone redistributes around the group center.
			centerY ??= defaultCenterY();
			el.style.left = `${offscreenLeft(el)}px`;
			el.style.top = `${dockSlot(member, docked(), centerY, side).top}px`;
			if (joinTrail(member)) return;

			settleMembers();
			seedMotion(member, { x: side === "left" ? LAUNCH_SPEED : -LAUNCH_SPEED, y: 0 });
		},

		removeMember(id) {
			const member = byId(id);
			if (!member) return;

			cancelMotion(id);
			trail.cancel(id);
			retiring.delete(id);
			members.splice(
				members.findIndex((m) => m.id === id),
				1
			);

			if (members.length === 0) {
				mode = "docked";
				activeId = undefined;
				flingLeaderId = undefined;
				// The dock height dies with the group, so a reborn group
				// re-centers as one — only the side is remembered. While any
				// member remains (even mid-exit), re-adds keep the old dock.
				centerY = undefined;
				return;
			}

			if (flingLeaderId === id) {
				flingLeaderId = undefined;
				const next = docked()[0];
				if (next) adoptDockFrom(next);
			}
			handOffActivePanel(id);
			syncMembers();
			if (!groupInFlight()) settleMembers();
		},

		retireMember(id, onGone) {
			const member = byId(id);
			if (!member) {
				onGone();
				return;
			}

			cancelMotion(id);
			trail.cancel(id);
			retiring.add(id);
			member.panel?.hide();
			member.el.style.pointerEvents = "none";
			setBubbleHover(member.el, false);
			setBubblePressed(member.el, false);

			// The panel hands over immediately (never shown for a departing
			// bubble) and the rest of the group closes the gap during the exit.
			handOffActivePanel(id);
			syncMembers();

			// A retiring drag leader hands the pointer to the next member;
			// the trail re-chains behind it and the drag carries on. A
			// thrown leader can't hand off mid-air — the group adopts a
			// dock where it stands and settles there instead.
			if (groupDragging && dragLeaderId === id) {
				const next = docked()[0]?.id;
				dragLeaderId = next;
				if (next) {
					for (const m of docked()) trail.chase(m, next);
				}
			} else if (flingLeaderId === id) {
				flingLeaderId = undefined;
				const next = docked()[0];
				if (next) adoptDockFrom(next);
			}
			if (!groupInFlight()) settleMembers();

			// Reduced motion: the exit fades in place instead of flying off.
			// Cancelling the fade (a restore) puts opacity straight back.
			if (prefersReducedMotion()) {
				const fade = member.el.animate([{ opacity: 1 }, { opacity: 0 }], {
					duration: 150,
					easing: "ease-in"
				});
				fade.onfinish = onGone;
				motions.set(id, () => fade.cancel());
				return;
			}

			// The exit side comes from where the bubble actually is — its
			// snapped-side memo can be stale, since group moves only restamp
			// the flung leader.
			const rect = member.el.getBoundingClientRect();
			const exitSide = chooseSide(rect.left + rect.width / 2);
			const exitUp = mode === "open";
			const exitTarget = (): GlideTarget => {
				if (exitUp) {
					return {
						left: member.el.getBoundingClientRect().left,
						top: -(member.el.offsetHeight + EDGE_MARGIN)
					};
				}
				return {
					left:
						exitSide === "left"
							? -(member.el.offsetWidth + EDGE_MARGIN)
							: viewportWidth() + EDGE_MARGIN,
					top: member.el.getBoundingClientRect().top
				};
			};
			const exitVelocity = exitUp
				? { x: 0, y: -LAUNCH_SPEED }
				: { x: exitSide === "left" ? -LAUNCH_SPEED : LAUNCH_SPEED, y: 0 };

			motions.set(
				id,
				startGlide(member.el, exitTarget, { initialVelocity: exitVelocity, onRest: onGone })
			);
		},

		restoreMember(id) {
			const member = byId(id);
			if (!member || !retiring.has(id)) return false;

			// Killing the exit glide also kills its onRest, so the pending
			// removal never lands; the bubble is simply a member again.
			cancelMotion(id);
			retiring.delete(id);
			member.el.style.pointerEvents = "";

			// Like a fresh add, the returning bubble is the latest interaction
			// and takes the active panel back (revealed once it nears its slot).
			activeId = id;
			syncMembers();
			if (mode === "open") hideAllPanels();
			centerY ??= defaultCenterY();

			// A bubble that already left the screen re-enters like a fresh
			// add — from the group's current position, not back along an
			// exit path the group may no longer occupy. A bubble still on
			// screen keeps reversing smoothly from where it is.
			const rect = member.el.getBoundingClientRect();
			const gone =
				rect.right <= 0 ||
				rect.left >= viewportWidth() ||
				rect.bottom <= 0 ||
				rect.top >= viewportHeight();
			if (gone) {
				if (mode === "open") {
					member.el.style.left = `${rowSlot(member, docked()).left}px`;
					member.el.style.top = `${-(member.el.offsetHeight + EDGE_MARGIN)}px`;
				} else {
					member.el.style.left = `${offscreenLeft(member.el)}px`;
					member.el.style.top = `${dockSlot(member, docked(), centerY, side).top}px`;
				}
			}

			if (gone) fadeInIfReduced(member.el);
			if (!joinTrail(member) && !groupInFlight()) {
				settleMembers();
				if (gone) {
					seedMotion(
						member,
						mode === "open"
							? { x: 0, y: LAUNCH_SPEED }
							: { x: side === "left" ? LAUNCH_SPEED : -LAUNCH_SPEED, y: 0 }
					);
				}
			}
			return true;
		},

		onTap(id) {
			const member = byId(id);
			if (!member) return;

			// No motion cancel: expand/collapse re-settle everything, and a
			// panel switch must not freeze a bubble mid-glide.
			if (mode === "docked") {
				expand();
				return;
			}

			if (id === activeId) {
				collapse();
				return;
			}
			switchTo(member);
		},

		onArrow(id, direction, toEnd) {
			if (mode === "open") {
				if (direction === "up" || direction === "down") return;

				// Row order is members order (newest leftmost), so stepping
				// the array IS stepping visually; ends clamp rather than wrap.
				const row = docked();
				const i = row.findIndex((m) => m.id === id);
				if (i === -1) return;
				row[i + (direction === "left" ? -1 : 1)]?.el.focus();
				return;
			}

			// Docked: arrows reposition the stack — up/down scoot it a short
			// step, left/right send it across to the other edge. A live drag
			// or throw keeps ownership of the position.
			if (groupInFlight()) return;
			const flock = docked();
			const first = flock[0];
			if (!first) return;

			if (direction === "left" || direction === "right") {
				if (side === direction) return;
				side = direction;
			} else {
				// Ctrl rides the clamp to the extreme: ±Infinity resolves to
				// the topmost/bottommost center the margins allow.
				centerY ??= defaultCenterY();
				const step = direction === "up" ? -DOCK_NUDGE : DOCK_NUDGE;
				centerY = clampCenter(toEnd ? step * Infinity : centerY + step, first.el, flock.length);
			}
			settleMembers();
		},

		onEscape() {
			if (mode !== "open") return;
			collapse();
			// The collapse reorder makes the active bubble topmost — focus
			// lands on it, the stack's single tab stop.
			docked()[0]?.el.focus();
		},

		onDelete(id) {
			if (mode !== "open" || retiring.has(id)) return;

			// The neighbor is chosen before removal reshuffles the row:
			// prefer the bubble to the right, falling back left at the end.
			const row = docked();
			const i = row.findIndex((m) => m.id === id);
			if (i === -1) return;
			const neighbor = row[i + 1] ?? row[i - 1];
			callbacks.remove(id);
			neighbor?.el.focus();
		},

		toggle() {
			const flock = docked();
			if (flock.length === 0) return;

			if (mode === "docked") {
				expand();
				const active = activeId ? byId(activeId) : undefined;
				(active ?? flock[0])?.el.focus();
				return;
			}
			collapse();
			docked()[0]?.el.focus();
		},

		state: () => mode,

		onDragStart(id, x, y, coarse) {
			const member = byId(id);
			if (!member) return false;

			cancelMotion(id);

			// Row bubbles drag individually (the per-bubble removal path),
			// but on the same chase spring as a docked drag — one drag feel
			// everywhere, and the trail's capture handling comes with it.
			if (mode === "open") {
				rowDraggingId = id;
				member.el.style.zIndex = `${Z_BUBBLE_TOP}`;
				hideAllPanels();
				trail.setPointer(x, y);
				trail.setRate(coarse ? TOUCH_CHASE_RATE : 1);
				trail.chase(member, id);
				return true;
			}

			// A docked drag is always led by the topmost bubble, whichever
			// member was grabbed: stack order (and so z-order) never changes,
			// and the group slides over until the leader's center is under
			// the pointer. The group owns every position from here.
			groupDragging = true;
			flingLeaderId = undefined;
			trail.setPointer(x, y);
			trail.setRate(coarse ? TOUCH_CHASE_RATE : 1);
			syncZOrder();

			const leaderId = docked()[0]?.id ?? id;
			dragLeaderId = leaderId;
			for (const m of members) {
				if (retiring.has(m.id)) continue;
				cancelMotion(m.id);
				trail.chase(m, leaderId);
			}
			return true;
		},

		onDragMove(x, y) {
			trail.setPointer(x, y);
		},

		onDragEnd(id, velocity) {
			const member = byId(id);
			if (!member) return false;

			// A released row bubble returns to its slot; the active panel
			// comes back once it arrives.
			if (rowDraggingId === id) {
				rowDraggingId = undefined;
				trail.cancel(id);
				motions.set(
					id,
					startGlide(member.el, () => rowSlot(member, docked()), {
						onRest: () => {
							motions.delete(id);
							const active = activeId ? byId(activeId) : undefined;
							if (mode === "open") active?.panel?.show();
						}
					})
				);
				return true;
			}

			if (!groupDragging) return false;
			groupDragging = false;

			// The leader takes the throw — resolved by id, so a member added
			// mid-drag doesn't steal it — and the trail keeps chasing until
			// it lands and teaches the group its new dock.
			const leader = docked().find((m) => m.id === dragLeaderId) ?? docked()[0] ?? member;
			dragLeaderId = undefined;
			flingLeaderId = leader.id;
			trail.cancel(leader.id);
			motions.set(
				leader.id,
				startFling(leader.el, velocity, config.ricochet(), () => {
					motions.delete(leader.id);
					flingLeaderId = undefined;
					adoptDockFrom(leader);
					settleMembers();
				})
			);
			return true;
		},

		onDismiss(id) {
			rowDraggingId = undefined;
			if (groupDragging) {
				groupDragging = false;
				dragLeaderId = undefined;
				trail.cancelAll();
				callbacks.removeAll();
				return;
			}
			callbacks.remove(id);
		},

		handleResize() {
			if (groupInFlight()) return;

			for (const m of members) {
				if (retiring.has(m.id) || m.id === rowDraggingId) continue;
				const slot = slotTargetFor(m);
				m.el.style.left = `${slot.left}px`;
				m.el.style.top = `${slot.top}px`;
			}
		}
	};
};
