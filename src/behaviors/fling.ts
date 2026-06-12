import { clampTop, maxRestTop } from "$src/behaviors/clamp";
import { prefersReducedMotion } from "$src/behaviors/reduced-motion";
import { runSimulation } from "$src/behaviors/simulate";
import { chooseSide, setSnappedSide, sideRestLeft } from "$src/behaviors/snap";
import { EDGE_MARGIN } from "$src/constants";
import { MAX_EDGE_DIP, REST_DISTANCE, REST_VELOCITY } from "$src/physics/config";
import { frictionDecay, projectDistance } from "$src/physics/friction";
import { springStep } from "$src/physics/spring";
import type { AxisState, Velocity } from "$src/types";
import { viewportWidth } from "$src/viewport";

/**
 * Simulates the bubble from release until it rests against a wall.
 *
 * Horizontal: a damped spring toward the wall chosen by projecting the
 * release velocity, so it always lands on an edge and arrives as hot as
 * it was thrown. Vertical: pure inertia with ricochet off the top/bottom
 * gap — which is what makes an angled throw hit the wall and slide
 * along it. `restitution` is the fraction of speed surviving each
 * bounce (0 = dead stop, 1 = lossless).
 *
 * Returns a cancel function (grabbing a bubble mid-flight). `onRest`
 * fires only on natural arrival.
 */
export const startFling = (
	el: HTMLElement,
	releaseVelocity: Velocity,
	restitution: number,
	onRest?: () => void
): (() => void) => {
	const rect = el.getBoundingClientRect();
	const projectedCenterX = rect.left + rect.width / 2 + projectDistance(releaseVelocity.x);
	const side = chooseSide(projectedCenterX);

	// All viewport-derived targets are read live, per frame — the viewport
	// can change mid-flight (zoom, resize, devtools), and a stale target
	// would carry the bubble to a coordinate that no longer exists.
	const targetLeft = (): number => sideRestLeft(el, side);

	// Reduced motion: the throw still lands where the velocity pointed
	// (side from the projected coast), just without the flight.
	if (prefersReducedMotion()) {
		return runSimulation(() => {
			el.style.left = `${targetLeft()}px`;
			el.style.top = `${clampTop(el, rect.top)}px`;
			setSnappedSide(el, side);
			onRest?.();
			return true;
		});
	}

	// A bubble released outside the vertical bounds (dragged off-screen)
	// springs back to the violated edge instead of teleporting to it.
	const verticalReturnEdge: "top" | "bottom" | undefined =
		rect.top < EDGE_MARGIN ? "top" : rect.top > maxRestTop(el) ? "bottom" : undefined;
	const verticalReturnTarget = (): number | undefined =>
		verticalReturnEdge === "top"
			? EDGE_MARGIN
			: verticalReturnEdge === "bottom"
				? maxRestTop(el)
				: undefined;

	// The off-screen dip cap arms only once the bubble is inside the screen:
	// a throw from inside gets its overshoot capped at the wall, while a
	// bubble released off-screen first springs back in uncapped.
	const minDipLeft = -MAX_EDGE_DIP;
	const maxDipLeft = (): number => viewportWidth() - el.offsetWidth + MAX_EDGE_DIP;
	let dipCapArmed = rect.left >= minDipLeft && rect.left <= maxDipLeft();

	let x: AxisState = { position: rect.left, velocity: releaseVelocity.x };
	let y: AxisState = { position: rect.top, velocity: releaseVelocity.y };

	const stepHorizontal = (dt: number) => {
		x = springStep(x, targetLeft(), dt);
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
		const returnTarget = verticalReturnTarget();
		if (returnTarget !== undefined) {
			y = springStep(y, returnTarget, dt);
			return;
		}
		y = { position: y.position + y.velocity * dt, velocity: y.velocity * frictionDecay(dt) };

		const max = maxRestTop(el);
		if (y.position <= EDGE_MARGIN)
			y = { position: EDGE_MARGIN, velocity: -y.velocity * restitution };
		else if (y.position >= max) y = { position: max, velocity: -y.velocity * restitution };
	};

	const isAtRest = (): boolean => {
		const returnTarget = verticalReturnTarget();
		const horizontal =
			Math.abs(x.position - targetLeft()) < REST_DISTANCE && Math.abs(x.velocity) < REST_VELOCITY;
		const vertical =
			Math.abs(y.velocity) < REST_VELOCITY &&
			(returnTarget === undefined || Math.abs(y.position - returnTarget) < REST_DISTANCE);
		return horizontal && vertical;
	};

	return runSimulation((dt) => {
		stepHorizontal(dt);
		stepVertical(dt);

		el.style.left = `${x.position}px`;
		el.style.top = `${y.position}px`;

		if (!isAtRest()) return false;

		el.style.left = `${targetLeft()}px`;
		el.style.top = `${clampTop(el, y.position)}px`;
		setSnappedSide(el, side);
		onRest?.();
		return true;
	});
};
