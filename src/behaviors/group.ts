import { clampTop } from "$src/behaviors/clamp";
import { startFling } from "$src/behaviors/fling";
import { startGlide } from "$src/behaviors/glide";
import { runSimulation } from "$src/behaviors/simulate";
import { chooseSide, getSnappedSide, sideRestLeft } from "$src/behaviors/snap";
import { EDGE_MARGIN, ROW_GAP, STACK_OFFSET, Z_BUBBLE_TOP } from "$src/constants";
import { setBubbleHover, setBubblePressed } from "$src/elements/bubble";
import { springStep } from "$src/physics/spring";
import type {
	AxisState,
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
	const chases = new Map<string, () => void>();
	const retiring = new Set<string>();
	let mode: "docked" | "open" = "docked";
	let side: BubbleSide = "right";
	let centerY: number | undefined;
	let activeId: string | undefined;
	let groupDragging = false;
	let rowDraggingId: string | undefined;

	// Live pointer position during a group drag — the leader's chase target.
	let grabX = 0;
	let grabY = 0;

	const byId = (id: string) => members.find((m) => m.id === id);

	// All layout math sees only the docked members: a retiring bubble stops
	// counting the moment its exit starts, so the others redistribute
	// while it's still flying out.
	const docked = () => members.filter((m) => !retiring.has(m.id));
	const dockedIndexOf = (id: string) => docked().findIndex((m) => m.id === id);

	const cancelMotion = (id: string) => {
		motions.get(id)?.();
		motions.delete(id);
	};

	const cancelChase = (id: string) => {
		chases.get(id)?.();
		chases.delete(id);
	};

	const cancelAllChases = () => {
		for (const cancel of chases.values()) cancel();
		chases.clear();
	};

	const restingPosition = (el: HTMLElement): GlideTarget => {
		const rect = el.getBoundingClientRect();
		return { left: rect.left, top: rect.top };
	};

	const stackHalf = () => ((docked().length - 1) * STACK_OFFSET) / 2;

	/** Keeps the whole stack inside the vertical edge gaps. */
	const clampCenter = (center: number, el: HTMLElement) => {
		const min = EDGE_MARGIN + el.offsetHeight / 2 + stackHalf();
		const max = window.innerHeight - EDGE_MARGIN - el.offsetHeight / 2 - stackHalf();
		return Math.min(Math.max(center, min), max);
	};

	/** Docked slot: pure function of the group center, side, and member index. */
	const dockSlotFor = (member: GroupMember): GlideTarget => {
		const el = member.el;
		const index = dockedIndexOf(member.id);
		if (centerY === undefined || index === -1) return restingPosition(el);

		const center = clampCenter(centerY, el);
		const top = center - el.offsetHeight / 2 - stackHalf() + index * STACK_OFFSET;
		return { left: sideRestLeft(el, side), top };
	};

	/** Row slot: the open bubbles sit centered in a row along the top gap. */
	const rowSlotFor = (member: GroupMember): GlideTarget => {
		const row = docked();
		const index = row.findIndex((m) => m.id === member.id);
		if (index === -1) return restingPosition(member.el);

		const width = member.el.offsetWidth;
		const total = row.length * width + (row.length - 1) * ROW_GAP;
		return {
			left: (window.innerWidth - total) / 2 + index * (width + ROW_GAP),
			top: EDGE_MARGIN
		};
	};

	const slotTargetFor = (member: GroupMember): GlideTarget =>
		mode === "open" ? rowSlotFor(member) : dockSlotFor(member);

	/** The grabbed bubble's landing teaches the group its new dock. */
	const adoptDockFrom = (member: GroupMember) => {
		const rect = member.el.getBoundingClientRect();
		side = getSnappedSide(member.el) ?? chooseSide(rect.left + rect.width / 2);
		centerY = rect.top + rect.height / 2 + stackHalf() - dockedIndexOf(member.id) * STACK_OFFSET;
	};

	const hideAllPanels = () => {
		for (const m of members) m.panel?.hide();
	};

	// Docked, the stack reads as one control: hovering or pressing any
	// member scales every member together.
	const setGroupHover = (hovered: boolean) => {
		for (const m of members) setBubbleHover(m.el, hovered);
	};

	const setGroupPressed = (pressed: boolean) => {
		for (const m of members) setBubblePressed(m.el, pressed);
	};

	const attachGroupFeedback = (el: HTMLElement) => {
		const whenDocked = (apply: () => void) => () => {
			if (mode === "docked") apply();
		};
		el.addEventListener(
			"pointerenter",
			whenDocked(() => setGroupHover(true))
		);
		el.addEventListener(
			"pointerleave",
			whenDocked(() => setGroupHover(false))
		);
		el.addEventListener(
			"pointerdown",
			whenDocked(() => setGroupPressed(true))
		);
		const release = whenDocked(() => setGroupPressed(false));
		el.addEventListener("pointerup", release);
		el.addEventListener("pointercancel", release);
	};

	/** Shows the active panel once its bubble is close enough to its slot. */
	const revealWhenNear = (member: GroupMember) => () => {
		if (mode !== "open" || member.id !== activeId) return;

		const slot = rowSlotFor(member);
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
		cancelAllChases();
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
		setGroupHover(false);
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

	const zoneTarget = (member: GroupMember): GlideTarget => {
		const c = zone.center();
		return {
			left: c.x - member.el.offsetWidth / 2,
			top: c.y - member.el.offsetHeight / 2
		};
	};

	/**
	 * Trail target during a group drag: follow your neighbor toward the
	 * leading bubble (chained springs make the tail), except while the
	 * dismiss target holds the group — then everyone converges on it.
	 */
	const chainTarget = (member: GroupMember, leaderId: string) => (): GlideTarget => {
		if (zone.captured()) return zoneTarget(member);

		const chain = docked();
		const i = chain.findIndex((m) => m.id === member.id);
		const toward = i < chain.findIndex((m) => m.id === leaderId) ? 1 : -1;
		const neighbor = chain[i + toward];
		if (!neighbor) return restingPosition(member.el);

		const rect = neighbor.el.getBoundingClientRect();
		return { left: rect.left, top: rect.top - toward * STACK_OFFSET };
	};

	/**
	 * Leader target during a group drag: its center rides the pointer, so
	 * grabbing the group anywhere reads as holding its topmost bubble.
	 * While the dismiss target holds the group — and through a captured
	 * release's exit — the leader rides the target instead.
	 */
	const grabTarget = (member: GroupMember) => (): GlideTarget => {
		if (zone.captured() || zone.dismissing()) return zoneTarget(member);
		return {
			left: grabX - member.el.offsetWidth / 2,
			top: grabY - member.el.offsetHeight / 2
		};
	};

	const startChase = (member: GroupMember, target: () => GlideTarget) => {
		const rect = member.el.getBoundingClientRect();
		let x: AxisState = { position: rect.left, velocity: 0 };
		let y: AxisState = { position: rect.top, velocity: 0 };

		chases.set(
			member.id,
			runSimulation((dt) => {
				const t = target();
				x = springStep(x, t.left, dt);
				y = springStep(y, t.top, dt);
				member.el.style.left = `${x.position}px`;
				member.el.style.top = `${y.position}px`;
				return false; // Lives until the group settles or is dismissed.
			})
		);
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
			attachGroupFeedback(el);

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
				el.style.left = `${rowSlotFor(member).left}px`;
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
			el.style.top = `${dockSlotFor(member).top}px`;
			settleMembers();
			seedMotion(member, { x: -LAUNCH_SPEED, y: 0 });
		},

		removeMember(id) {
			const member = byId(id);
			if (!member) return;

			cancelMotion(id);
			cancelChase(id);
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
			retiring.add(id);
			member.panel?.hide();
			member.el.style.pointerEvents = "none";
			setBubbleHover(member.el, false);
			setBubblePressed(member.el, false);

			// The panel hands over immediately (never shown for a departing
			// bubble) and the rest of the group closes the gap during the exit.
			handOffActivePanel(id);
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
			if (!groupDragging) settleMembers();
			return true;
		},

		onTap(id) {
			const member = byId(id);
			if (!member) return;

			cancelMotion(id);

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
			grabX = x;
			grabY = y;
			syncZOrder();

			const leaderId = docked()[0]?.id ?? id;
			for (const m of members) {
				if (retiring.has(m.id)) continue;
				cancelMotion(m.id);
				startChase(m, m.id === leaderId ? grabTarget(m) : chainTarget(m, leaderId));
			}
			return true;
		},

		onDragMove(x, y) {
			grabX = x;
			grabY = y;
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
					startGlide(member.el, () => rowSlotFor(member), {
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

			// The leader takes the throw; the trail keeps chasing it until
			// it lands and teaches the group its new dock.
			const leader = docked()[0] ?? member;
			cancelChase(leader.id);
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
				cancelAllChases();
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
