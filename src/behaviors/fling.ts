import { clampTop } from "$src/behaviors/clamp";
import { chooseSide, setSnappedSide, sideRestLeft } from "$src/behaviors/snap";
import { EDGE_MARGIN } from "$src/constants";
import {
	MAX_EDGE_DIP,
	MAX_FRAME_DT,
	REST_DISTANCE,
	REST_VELOCITY,
	RESTITUTION
} from "$src/physics/config";
import { frictionDecay, projectDistance } from "$src/physics/friction";
import { springStep } from "$src/physics/spring";
import type { AxisState, Velocity } from "$src/types";

/**
 * Simulates the bubble from release until it rests against a wall.
 *
 * Horizontal: a damped spring toward the wall chosen by projecting the
 * release velocity, so it always lands on an edge and arrives as hot as
 * it was thrown. Vertical: pure inertia clamped at the top/bottom gap —
 * which is what makes an angled throw hit the wall and slide along it.
 *
 * Returns a cancel function (grabbing a bubble mid-flight).
 */
export const startFling = (el: HTMLElement, releaseVelocity: Velocity): (() => void) => {
	const rect = el.getBoundingClientRect();
	const projectedCenterX = rect.left + rect.width / 2 + projectDistance(releaseVelocity.x);
	const side = chooseSide(projectedCenterX);
	const targetLeft = sideRestLeft(el, side);

	// A bubble released outside the vertical bounds (dragged off-screen)
	// springs back to the violated edge instead of teleporting to it.
	const maxTop = window.innerHeight - el.offsetHeight - EDGE_MARGIN;
	const verticalReturnTarget =
		rect.top < EDGE_MARGIN ? EDGE_MARGIN : rect.top > maxTop ? maxTop : undefined;

	// The off-screen dip cap arms only once the bubble is inside the screen:
	// a throw from inside gets its overshoot capped at the wall, while a
	// bubble released off-screen first springs back in uncapped.
	const minDipLeft = -MAX_EDGE_DIP;
	const maxDipLeft = (): number => window.innerWidth - el.offsetWidth + MAX_EDGE_DIP;
	let dipCapArmed = rect.left >= minDipLeft && rect.left <= maxDipLeft();

	let x: AxisState = { position: rect.left, velocity: releaseVelocity.x };
	let y: AxisState = { position: rect.top, velocity: releaseVelocity.y };
	let lastTime: number | undefined;
	let frameId = 0;

	const stepHorizontal = (dt: number) => {
		x = springStep(x, targetLeft, dt);
		if (!dipCapArmed && x.position >= minDipLeft && x.position <= maxDipLeft()) {
			dipCapArmed = true;
		}
		if (!dipCapArmed) return;
		// Hitting the dip cap is the wall hit: horizontal momentum dies there
		// and the spring pulls the bubble back out from the capped depth.
		if (x.position < minDipLeft) x = { position: minDipLeft, velocity: 0 };
		else if (x.position > maxDipLeft()) x = { position: maxDipLeft(), velocity: 0 };
	};

	const stepVertical = (dt: number) => {
		if (verticalReturnTarget !== undefined) {
			y = springStep(y, verticalReturnTarget, dt);
			return;
		}
		y = { position: y.position + y.velocity * dt, velocity: y.velocity * frictionDecay(dt) };
		const max = window.innerHeight - el.offsetHeight - EDGE_MARGIN;
		if (y.position <= EDGE_MARGIN) y = { position: EDGE_MARGIN, velocity: -y.velocity * RESTITUTION };
		else if (y.position >= max) y = { position: max, velocity: -y.velocity * RESTITUTION };
	};

	const isAtRest = (): boolean => {
		const horizontal =
			Math.abs(x.position - targetLeft) < REST_DISTANCE && Math.abs(x.velocity) < REST_VELOCITY;
		const vertical =
			Math.abs(y.velocity) < REST_VELOCITY &&
			(verticalReturnTarget === undefined ||
				Math.abs(y.position - verticalReturnTarget) < REST_DISTANCE);
		return horizontal && vertical;
	};

	const frame = (now: number) => {
		const dt = Math.min((now - (lastTime ?? now)) / 1000, MAX_FRAME_DT);
		lastTime = now;

		stepHorizontal(dt);
		stepVertical(dt);

		el.style.left = `${x.position}px`;
		el.style.top = `${y.position}px`;

		if (isAtRest()) {
			el.style.left = `${targetLeft}px`;
			el.style.top = `${clampTop(el, y.position)}px`;
			setSnappedSide(el, side);
			return;
		}
		frameId = requestAnimationFrame(frame);
	};

	frameId = requestAnimationFrame(frame);
	return () => cancelAnimationFrame(frameId);
};
