import { Z_DISMISS_TARGET } from "$src/constants";
import { BUBBLE_SIZE } from "$src/elements/bubble";

export const DISMISS_TARGET_SIZE = BUBBLE_SIZE * 2;

/** Surface shrink while a bubble is captured. Rest is full size, so scaling only ever goes down (crisp). */
const CAPTURED_SCALE = 0.85;

const createXIcon = (): SVGSVGElement => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("width", "44");
	svg.setAttribute("height", "44");
	svg.setAttribute("fill", "none");
	svg.setAttribute("stroke", "#ffffff");
	svg.setAttribute("stroke-width", "1.5");
	svg.setAttribute("stroke-linecap", "round");
	svg.innerHTML = '<path d="M18 6 6 18M6 6l12 12" />';
	return svg;
};

export interface DismissTargetElement {
	el: HTMLElement;
	setCaptured: (captured: boolean) => void;
}

export const createDismissTargetElement = (): DismissTargetElement => {
	const el = document.createElement("div");
	Object.assign(el.style, {
		position: "fixed",
		display: "none",
		width: `${DISMISS_TARGET_SIZE}px`,
		height: `${DISMISS_TARGET_SIZE}px`,
		// Below every bubble: captured bubbles ride on top of the target.
		zIndex: `${Z_DISMISS_TARGET}`,
		pointerEvents: "none",
		alignItems: "center",
		justifyContent: "center"
	} satisfies Partial<CSSStyleDeclaration>);

	const surface = document.createElement("div");
	Object.assign(surface.style, {
		width: `${DISMISS_TARGET_SIZE}px`,
		height: `${DISMISS_TARGET_SIZE}px`,
		flexShrink: "0",
		borderRadius: "50%",
		background: "rgba(255, 255, 255, 0.18)",
		border: "1px solid rgba(255, 255, 255, 0.35)",
		boxSizing: "border-box",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		transition: "scale 150ms ease"
	} satisfies Partial<CSSStyleDeclaration>);

	surface.appendChild(createXIcon());
	el.appendChild(surface);

	// Purely a pointer-drag affordance; keyboard dismissal has its own
	// path, so assistive tech never needs to know this exists.
	el.setAttribute("aria-hidden", "true");
	document.body.appendChild(el);

	const setCaptured = (captured: boolean) => {
		surface.style.scale = captured ? `${CAPTURED_SCALE}` : "1";
	};

	return { el, setCaptured };
};
