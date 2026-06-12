import { prefersReducedMotion } from "$src/behaviors/reduced-motion";
import { EDGE_MARGIN, Z_PANEL } from "$src/constants";
import { BUBBLE_SIZE } from "$src/elements/bubble";
import type { PanelAppearance, PanelController } from "$src/types";
import { viewportWidth } from "$src/viewport";

/** Gap between the bubble and the panel below it. */
const PANEL_GAP = 18;

/** Panel top edge when the bubble rests at the active (top center) spot. */
const PANEL_TOP = EDGE_MARGIN + BUBBLE_SIZE + PANEL_GAP;

const SHOW_MS = 150;

/** Faster than the show: the exit rides the departing group and should read as a flick. */
const HIDE_MS = 120;

/** Corner radius of the panel surface. */
const SURFACE_RADIUS = 16;

/** Side length of the rotated-square caret poking out of the panel top. */
const CARET_SIZE = 12;

/** Keeps the caret clear of the surface's rounded corners. */
const CARET_INSET = 16;

/**
 * The expanded content panel. A plain fixed overlay rather than a
 * popover: the top layer would force the panel above the bubbles, and
 * bubbles must always paint on top (a bubble dragged away slides over
 * the fading panel, never behind it) — hence the layered z constants.
 *
 * While visible — fade-out included — the panel follows the group
 * every frame: centered under the flock's centroid, clamped to the
 * screen margins. With no attach point (group emptied) it freezes in
 * place and finishes its fade there. The caret along its top edge aims
 * at this panel's own bubble.
 */
export const createPanel = (
	attachPoint: () => { x: number; bottom: number } | undefined,
	bubble: HTMLElement,
	content: HTMLElement,
	options: {
		id: string;
		label?: string;
		appearance: PanelAppearance;
		onEscape: () => void;
	}
): PanelController => {
	const el = document.createElement("div");

	// A non-modal dialog: the host page stays reachable behind it. The
	// owning bubble points here via aria-controls.
	el.id = options.id;
	el.setAttribute("role", "dialog");
	if (options.label) el.setAttribute("aria-label", options.label);

	// Escape from anywhere inside the panel collapses the group, same as
	// from the bubbles themselves (dialog convention).
	el.addEventListener("keydown", (event) => {
		if (event.key !== "Escape") return;
		event.preventDefault();
		options.onEscape();
	});

	Object.assign(el.style, {
		position: "fixed",
		display: "none",
		flexDirection: "column",
		zIndex: `${Z_PANEL}`,
		transformOrigin: "top center"
	} satisfies Partial<CSSStyleDeclaration>);

	const caret = document.createElement("div");
	Object.assign(caret.style, {
		position: "absolute",
		top: `${-CARET_SIZE / 2}px`,
		width: `${CARET_SIZE}px`,
		height: `${CARET_SIZE}px`,
		rotate: "45deg"
	} satisfies Partial<CSSStyleDeclaration>);

	// The surface owns background, clipping, and the height constraint —
	// it never scrolls, it constrains, so content scrolls its own interior
	// regions instead of putting a scrollbar against the rounded edge.
	const surface = document.createElement("div");
	Object.assign(surface.style, {
		display: "flex",
		flexDirection: "column",
		minHeight: "0",
		overflow: "hidden",
		borderRadius: `${SURFACE_RADIUS}px`
	} satisfies Partial<CSSStyleDeclaration>);

	// All colors and sizing live here so configure() can repaint in place.
	// The viewport always caps the consumer's size choices: width inside
	// the side margins, height inside the gap under a top-docked bubble.
	// Percentages, not vw/vh — the panel is fixed, so % resolves against
	// the scrollbar-free viewport while vw/vh include page scrollbars.
	const setAppearance = ({ theme, width, maxHeight }: PanelAppearance) => {
		el.style.width = `min(${width}px, calc(100% - ${EDGE_MARGIN * 2}px))`;
		el.style.maxHeight =
			maxHeight === undefined
				? `calc(100% - ${PANEL_TOP + EDGE_MARGIN}px)`
				: `min(${maxHeight}px, calc(100% - ${PANEL_TOP + EDGE_MARGIN}px))`;
		caret.style.background = theme.panelSurface;
		surface.style.background = theme.panelSurface;
		surface.style.color = theme.panelText;
		surface.style.boxShadow = theme.panelShadow;
	};
	setAppearance(options.appearance);

	surface.appendChild(content);
	el.appendChild(caret);
	el.appendChild(surface);
	document.body.appendChild(el);

	const position = () => {
		const point = attachPoint();
		if (point === undefined) return;

		const maxLeft = viewportWidth() - el.offsetWidth - EDGE_MARGIN;
		const centered = point.x - el.offsetWidth / 2;
		const left = Math.min(Math.max(centered, EDGE_MARGIN), maxLeft);
		el.style.left = `${left}px`;
		el.style.top = `${point.bottom + PANEL_GAP}px`;

		// The caret aims at this panel's own bubble, not the panel center.
		const bubbleRect = bubble.getBoundingClientRect();
		const aimed = bubbleRect.left + bubbleRect.width / 2 - left - CARET_SIZE / 2;
		const maxCaret = el.offsetWidth - CARET_INSET - CARET_SIZE;
		caret.style.left = `${Math.min(Math.max(aimed, CARET_INSET), maxCaret)}px`;
	};

	let followFrame = 0;
	const followLoop = () => {
		position();
		followFrame = requestAnimationFrame(followLoop);
	};

	let hideAnimation: Animation | undefined;
	const isOpen = () => el.style.display !== "none";

	const show = () => {
		// A show during the fade-out reclaims the panel before it hides.
		if (hideAnimation) {
			hideAnimation.cancel();
			hideAnimation = undefined;
			return;
		}
		if (isOpen()) return;
		el.style.display = "flex";
		position();
		followFrame = requestAnimationFrame(followLoop);

		// Reduced motion keeps the fades (opacity is fine) but drops the zoom.
		el.animate(
			prefersReducedMotion()
				? [{ opacity: 0 }, { opacity: 1 }]
				: [
						{ opacity: 0, scale: "0.95" },
						{ opacity: 1, scale: "1" }
					],
			{ duration: SHOW_MS, easing: "ease-out" }
		);
	};

	const hide = () => {
		if (!isOpen() || hideAnimation) return;

		// Reduced motion hides instantly: the group snaps home in one
		// tick, and a lingering fade would outlive the collapse it
		// belongs to. The fade-in stays — arrivals can afford the beat.
		if (prefersReducedMotion()) {
			el.style.display = "none";
			cancelAnimationFrame(followFrame);
			return;
		}

		// A hide can land while the show fade is still young — retiring an
		// active bubble hands its neighbor's panel in, and a same-tick
		// reclaim flips it right back out. Departing from the painted state
		// keeps a barely-shown panel from snapping fully visible to fade.
		const { opacity, scale } = getComputedStyle(el);
		hideAnimation = el.animate(
			[
				{ opacity, scale: scale === "none" ? "1" : scale },
				{ opacity: 0, scale: "0.97" }
			],
			{ duration: HIDE_MS, easing: "ease-in" }
		);
		hideAnimation.onfinish = () => {
			el.style.display = "none";
			cancelAnimationFrame(followFrame);
			hideAnimation = undefined;
		};
	};

	const destroy = () => {
		cancelAnimationFrame(followFrame);
		el.remove();
	};

	return { show, hide, setAppearance, destroy };
};
