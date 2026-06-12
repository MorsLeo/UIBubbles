import { clampTop } from "$src/behaviors/clamp";
import { startFling } from "$src/behaviors/fling";
import { startGlide } from "$src/behaviors/glide";
import { createGroupFeedback } from "$src/behaviors/group/feedback";
import { dockFromLanding, dockSlot, rowSlot } from "$src/behaviors/group/layout";
import { createDragTrail } from "$src/behaviors/group/trail";
import { chooseSide, getSnappedSide } from "$src/behaviors/snap";
import { EDGE_MARGIN, Z_BUBBLE_TOP } from "$src/constants";
import { setBubbleHover, setBubblePressed } from "$src/elements/bubble";
import type {
	BubbleGroup,
	BubbleSide,
	DismissZone,
	GlideTarget,
	GroupCallbacks,
	GroupMember
} from "$src/types";

/** How close (px) a bubble must be to its row slot before its panel appears. */
const PANEL_APPEAR_DISTANCE = 100;

/** Initial speed (px/s) for entrances and exits — fast launch, long spring tail. */
const LAUNCH_SPEED = 2400;

/**
 * Coordinates every bubble. Docked, they're a stack distributed around
 * a group-owned center: they drag together as a chained trail, fling
 * together, and dismiss together. Tapped open, they form a centered row
 * at the top with one member's panel showing — tap to switch panels,
 * tap the active bubble to collapse home. Row bubbles drag (and
 * dismiss) individually, returning to their slot on release.
 */
export const createBubbleGroup = (zone: DismissZone, callbacks: GroupCallbacks): BubbleGroup => {
	const members: GroupMember[] = [];
	const motions = new Map<string, () => void>();
	const retiring = new Set<string>();
	let mode: "docked" | "open" = "docked";
	let side: BubbleSide = "right";
	let centerY: number | undefined;
	let activeId: string | undefined;
	let groupDragging = false;
	let dragLeaderId: string | undefined;
	let rowDraggingId: string | undefined;

	const byId = (id: string) => members.find((m) => m.id === id);

	// All layout math sees only the docked members: a retiring bubble stops
	// counting the moment its exit starts, so the others redistribute
	// while it's still flying out.
	const docked = () => members.filter((m) => !retiring.has(m.id));

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
		settleMembers();
	};

	const collapse = () => {
		mode = "docked";
		centerY ??= window.innerHeight / 2;
		hideAllPanels();

		// The active bubble leads the stack home: the most recently used
		// member becomes topmost. Reordering happens only here — switching
		// panels while open never shuffles the row.
		const i = activeId ? members.findIndex((m) => m.id === activeId) : -1;
		if (i > 0) members.unshift(...members.splice(i, 1));

		settleMembers();
	};

	const switchTo = (member: GroupMember) => {
		hideAllPanels();
		activeId = member.id;
		member.panel?.show();
	};

	/** A departing active bubble hands its panel to the group's first remaining member. */
	const handOffActivePanel = (leavingId: string) => {
		if (activeId !== leavingId) return;

		activeId = docked().find((m) => m.id !== leavingId)?.id;
		const next = activeId ? byId(activeId) : undefined;
		if (mode === "open" && next) next.panel?.show();
	};

	/** A member appearing mid-drag (added or restored) joins the live trail. */
	const joinDragTrail = (member: GroupMember): boolean => {
		if (!groupDragging || !dragLeaderId) return false;
		trail.chase(member, dragLeaderId);
		return true;
	};

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
			const el = member.el;
			feedback.attach(el);

			// The first bubble enters with the standard fling and teaches the
			// group its dock on landing.
			if (members.length === 1) {
				el.style.left = `${window.innerWidth + EDGE_MARGIN}px`;
				el.style.top = `${clampTop(el, (window.innerHeight - el.offsetHeight) / 2)}px`;
				motions.set(
					member.id,
					startFling(el, { x: 0, y: 0 }, () => {
						motions.delete(member.id);
						adoptDockFrom(member);
					})
				);
				return;
			}

			if (mode === "open") {
				// Falls in from off-screen top into the far-left slot and takes
				// the active panel (revealed by its arrival); the row shifts over.
				el.style.left = `${rowSlot(member, docked()).left}px`;
				el.style.top = `${-(el.offsetHeight + EDGE_MARGIN)}px`;
				hideAllPanels();
				settleMembers();
				seedMotion(member, { x: 0, y: LAUNCH_SPEED });
				return;
			}

			// Joins the docked stack from off-screen at slot height; everyone
			// redistributes around the group center.
			centerY ??= window.innerHeight / 2;
			el.style.left = `${window.innerWidth + EDGE_MARGIN}px`;
			el.style.top = `${dockSlot(member, docked(), centerY, side).top}px`;
			if (joinDragTrail(member)) return;

			settleMembers();
			seedMotion(member, { x: -LAUNCH_SPEED, y: 0 });
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
				return;
			}

			handOffActivePanel(id);
			if (!groupDragging) settleMembers();
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

			// A retiring drag leader hands the pointer to the next member;
			// the trail re-chains behind it and the drag carries on.
			if (groupDragging && dragLeaderId === id) {
				const next = docked()[0]?.id;
				dragLeaderId = next;
				if (next) {
					for (const m of docked()) trail.chase(m, next);
				}
			}
			if (!groupDragging) settleMembers();

			const rect = member.el.getBoundingClientRect();
			const exitSide = getSnappedSide(member.el) ?? chooseSide(rect.left + rect.width / 2);
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
							: window.innerWidth + EDGE_MARGIN,
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
			if (mode === "open") hideAllPanels();
			centerY ??= window.innerHeight / 2;
			if (!joinDragTrail(member) && !groupDragging) settleMembers();
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

		onDragStart(id, x, y) {
			const member = byId(id);
			if (!member) return false;

			cancelMotion(id);

			// Row bubbles drag individually (the per-bubble removal path);
			// docked bubbles move the whole group as a trail.
			if (mode === "open") {
				rowDraggingId = id;
				member.el.style.zIndex = `${Z_BUBBLE_TOP}`;
				hideAllPanels();
				return false;
			}

			// A docked drag is always led by the topmost bubble, whichever
			// member was grabbed: stack order (and so z-order) never changes,
			// and the group slides over until the leader's center is under
			// the pointer. The group owns every position from here.
			groupDragging = true;
			trail.setPointer(x, y);
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
			trail.cancel(leader.id);
			motions.set(
				leader.id,
				startFling(leader.el, velocity, () => {
					motions.delete(leader.id);
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
			if (groupDragging) return;

			for (const m of members) {
				if (retiring.has(m.id) || m.id === rowDraggingId) continue;
				const slot = slotTargetFor(m);
				m.el.style.left = `${slot.left}px`;
				m.el.style.top = `${slot.top}px`;
			}
		}
	};
};
