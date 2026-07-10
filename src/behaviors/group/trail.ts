import { restingPosition } from "$src/behaviors/group/layout";
import { prefersReducedMotion } from "$src/behaviors/reduced-motion";
import { runSimulation } from "$src/behaviors/simulate";
import { STACK_OFFSET } from "$src/constants";
import { springStep } from "$src/physics/spring";
import type { AxisState, DragTrail, GlideTarget, GroupMember } from "$src/types";

/**
 * The chase simulations behind a docked group drag. The leader's center
 * rides the pointer — grabbing the group anywhere reads as holding its
 * topmost bubble — and every other member springs after its neighbor
 * toward the leader, the chained springs making the tail.
 */
export const createDragTrail = (stack: () => GroupMember[]): DragTrail => {
	const chases = new Map<string, () => void>();

	// Live pointer position — the leader's chase target.
	let grabX = 0;
	let grabY = 0;

	// Time-scale on the chase springs: touch drags run them faster so the
	// group tracks a finger as tightly as an accelerated mouse pointer.
	let rate = 1;

	const chainTarget = (member: GroupMember, leaderId: string) => (): GlideTarget => {
		const chain = stack();
		const i = chain.findIndex((m) => m.id === member.id);
		const toward = i < chain.findIndex((m) => m.id === leaderId) ? 1 : -1;
		const neighbor = chain[i + toward];
		if (!neighbor) return restingPosition(member.el);

		const rect = neighbor.el.getBoundingClientRect();
		return { left: rect.left, top: rect.top - toward * STACK_OFFSET };
	};

	const grabTarget = (member: GroupMember) => (): GlideTarget => ({
		left: grabX - member.el.offsetWidth / 2,
		top: grabY - member.el.offsetHeight / 2
	});

	const setPointer = (x: number, y: number) => {
		grabX = x;
		grabY = y;
	};

	const setRate = (next: number) => {
		rate = next;
	};

	const cancel = (id: string) => {
		chases.get(id)?.();
		chases.delete(id);
	};

	const cancelAll = () => {
		for (const stop of chases.values()) stop();
		chases.clear();
	};

	const chase = (member: GroupMember, leaderId: string) => {
		// The member may still be chasing from a previous drag (trails keep
		// chasing through the release fling); cancel it, or the replaced
		// simulation runs forever with no handle left to stop it.
		cancel(member.id);

		const target = member.id === leaderId ? grabTarget(member) : chainTarget(member, leaderId);
		const rect = member.el.getBoundingClientRect();
		let x: AxisState = { position: rect.left, velocity: 0 };
		let y: AxisState = { position: rect.top, velocity: 0 };

		// Reduced motion drops the chase springs: the group rides the
		// pointer as one rigid block — the lag IS the decoration.
		const reduced = prefersReducedMotion();

		chases.set(
			member.id,
			runSimulation((dt) => {
				const t = target();
				if (reduced) {
					member.el.style.left = `${t.left}px`;
					member.el.style.top = `${t.top}px`;
					return false;
				}

				x = springStep(x, t.left, dt * rate);
				y = springStep(y, t.top, dt * rate);
				member.el.style.left = `${x.position}px`;
				member.el.style.top = `${y.position}px`;
				return false; // Lives until the group settles.
			})
		);
	};

	return { setPointer, setRate, chase, cancel, cancelAll };
};
