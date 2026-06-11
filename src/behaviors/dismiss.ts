import { startGlide } from "$src/behaviors/glide";
import { DISMISS_ATTRACT_RADIUS, DISMISS_CAPTURE_RADIUS } from "$src/constants";
import { createDismissTargetElement, DISMISS_TARGET_SIZE } from "$src/elements/dismiss-target";
import type { DismissZone, GlideTarget } from "$src/types";

/** Gap between the resting target and the bottom of the screen. */
const BOTTOM_MARGIN = 24;

/** Extra slack before a captured bubble is released — prevents flicker at the boundary. */
const RELEASE_SLACK = 12;

/** Max distance (px) the target leans toward the cursor at full attraction. */
const MAX_PULL = 64;

/** How much of the cursor's offset from the rest point the captured pair follows. */
const TETHER_FACTOR = 0.65;

export const createDismissZone = (): DismissZone => {
	const { el, setCaptured } = createDismissTargetElement();

	let cancelGlide: (() => void) | undefined;
	let cancelTransition: (() => void) | undefined;
	let visible = false;
	let isCaptured = false;
	let destroyed = false;
	let settled = false;
	let lastX = 0;
	let lastY = 0;

	const restLeft = () => (window.innerWidth - DISMISS_TARGET_SIZE) / 2;
	const restTop = () => window.innerHeight - DISMISS_TARGET_SIZE - BOTTOM_MARGIN;
	const restCenterX = () => restLeft() + DISMISS_TARGET_SIZE / 2;
	const restCenterY = () => restTop() + DISMISS_TARGET_SIZE / 2;
	const offScreenTop = () => window.innerHeight + DISMISS_TARGET_SIZE;

	const center = () => {
		const rect = el.getBoundingClientRect();
		return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
	};

	/** Magnetic lean: position for a free cursor, falling off quadratically with distance. */
	const pullPosition = (x: number, y: number): GlideTarget => {
		const dx = x - restCenterX();
		const dy = y - restCenterY();
		const distance = Math.hypot(dx, dy);
		if (distance >= DISMISS_ATTRACT_RADIUS || distance === 0) {
			return { left: restLeft(), top: restTop() };
		}

		const pull = MAX_PULL * (1 - distance / DISMISS_ATTRACT_RADIUS) ** 2;
		return {
			left: restLeft() + (dx / distance) * pull,
			top: restTop() + (dy / distance) * pull
		};
	};

	/** Captured pair-drag: follows the cursor's offset from the rest point against the tether. */
	const tetherPosition = (x: number, y: number): GlideTarget => ({
		left: restLeft() + (x - restCenterX()) * TETHER_FACTOR,
		top: restTop() + (y - restCenterY()) * TETHER_FACTOR
	});

	const setPosition = (target: GlideTarget) => {
		el.style.left = `${target.left}px`;
		el.style.top = `${target.top}px`;
	};

	/**
	 * Capture/escape swap the position function the target lives on, which
	 * is discontinuous — so each swap glides to the new (live) position
	 * first, then resumes direct writes once the spring catches up.
	 */
	const transitionTo = (position: (x: number, y: number) => GlideTarget) => {
		cancelTransition?.();
		cancelTransition = startGlide(el, () => position(lastX, lastY), {
			onRest: () => {
				cancelTransition = undefined;
			}
		});
	};

	const show = () => {
		if (visible) return;
		visible = true;
		settled = false;

		el.style.display = "flex";
		el.style.left = `${restLeft()}px`;
		el.style.top = `${offScreenTop()}px`;

		cancelGlide?.();
		cancelGlide = startGlide(el, () => ({ left: restLeft(), top: restTop() }), {
			onRest: () => {
				settled = true;
			}
		});
	};

	const hide = () => {
		if (!visible) return;
		visible = false;
		settled = false;

		isCaptured = false;
		setCaptured(false);
		cancelTransition?.();
		cancelTransition = undefined;

		cancelGlide?.();
		cancelGlide = startGlide(el, () => ({ left: restLeft(), top: offScreenTop() }), {
			onRest: () => {
				el.style.display = "none";
				if (destroyed) el.remove();
			}
		});
	};

	const track = (x: number, y: number) => {
		if (!visible) return false;
		lastX = x;
		lastY = y;

		if (isCaptured) {
			if (settled && !cancelTransition) setPosition(tetherPosition(x, y));

			// Escape is measured from the rest point — the tethered pair moves
			// with the cursor, so its own center can't be the boundary.
			if (
				Math.hypot(x - restCenterX(), y - restCenterY()) >
				DISMISS_CAPTURE_RADIUS + RELEASE_SLACK
			) {
				isCaptured = false;
				setCaptured(false);
				transitionTo(pullPosition);
			}
			return isCaptured;
		}

		if (settled && !cancelTransition) setPosition(pullPosition(x, y));

		// Same reference frame as the escape check above — measuring capture
		// from the (displaced) live center instead would re-capture instantly
		// after every escape and oscillate at the boundary.
		if (Math.hypot(x - restCenterX(), y - restCenterY()) < DISMISS_CAPTURE_RADIUS) {
			isCaptured = true;
			setCaptured(true);
			transitionTo(tetherPosition);
		}
		return isCaptured;
	};

	// Destroying mid-exit lets the off-screen animation finish first; the
	// exit glide's onRest does the actual removal.
	const destroy = () => {
		destroyed = true;
		if (visible) {
			hide();
		} else if (el.style.display === "none") {
			cancelGlide?.();
			cancelTransition?.();
			el.remove();
		}
	};

	return { show, track, captured: () => isCaptured, center, hide, destroy };
};
