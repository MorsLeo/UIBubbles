import { EDGE_MARGIN } from "$src/constants";
import { BUBBLE_SIZE } from "$src/elements/bubble";
import type { PanelController } from "$src/types";

/** Gap between the bubble and the panel below it. */
const PANEL_GAP = 12;

/** Panel top edge when the bubble rests at the active (top center) spot. */
const PANEL_TOP = EDGE_MARGIN + BUBBLE_SIZE + PANEL_GAP;

const FADE_MS = 150;

/**
 * The expanded content panel. A plain fixed overlay rather than a
 * popover: the top layer would force the panel above the bubble, and
 * the bubble must always paint on top (a bubble dragged away slides
 * over the fading panel, never behind it). Same z-index as the bubble,
 * appended before it, so DOM order keeps the bubble on top.
 *
 * While visible — fade-out included — the panel follows its bubble
 * every frame, centered beneath it, so it rides along with glides,
 * drags, and resizes.
 */
export const createPanel = (bubble: HTMLElement, content: HTMLElement): PanelController => {
	const el = document.createElement("div");
	el.setAttribute("role", "dialog");
	Object.assign(el.style, {
		position: "fixed",
		display: "none",
		zIndex: "2147483647",
		transformOrigin: "top center",
		width: `min(360px, calc(100vw - ${EDGE_MARGIN * 2}px))`,
		maxHeight: `calc(100vh - ${PANEL_TOP + EDGE_MARGIN}px)`,
		overflow: "auto",
		borderRadius: "16px",
		background: "#1c1c1e",
		color: "#ffffff",
		boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)"
	} satisfies Partial<CSSStyleDeclaration>);

	el.appendChild(content);
	document.body.appendChild(el);

	const position = () => {
		const rect = bubble.getBoundingClientRect();
		const maxLeft = window.innerWidth - el.offsetWidth - EDGE_MARGIN;
		const centered = rect.left + rect.width / 2 - el.offsetWidth / 2;
		el.style.left = `${Math.min(Math.max(centered, EDGE_MARGIN), maxLeft)}px`;
		el.style.top = `${rect.bottom + PANEL_GAP}px`;
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
		el.style.display = "block";
		position();
		followFrame = requestAnimationFrame(followLoop);
		el.animate(
			[
				{ opacity: 0, scale: "0.95" },
				{ opacity: 1, scale: "1" }
			],
			{ duration: FADE_MS, easing: "ease-out" }
		);
	};

	const hide = () => {
		if (!isOpen() || hideAnimation) return;
		hideAnimation = el.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: FADE_MS,
			easing: "ease-in"
		});
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

	return { show, hide, destroy };
};
