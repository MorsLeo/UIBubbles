export const BUBBLE_SIZE = 56;

/** Pixels added to the surface diameter on hover (~1.07x). */
const HOVER_GROWTH = 4;

const createPlusIcon = (): SVGSVGElement => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("width", "24");
	svg.setAttribute("height", "24");
	svg.setAttribute("fill", "none");
	svg.setAttribute("stroke", "#000000");
	svg.setAttribute("stroke-width", "2");
	svg.setAttribute("stroke-linecap", "round");
	svg.innerHTML = '<path d="M12 5v14M5 12h14" />';
	return svg;
};

/**
 * The visible circle. Lives inside the positioned element so hover growth
 * is a real size change (always crisp) instead of a transform scale, which
 * blurs the rasterized layer.
 */
const createSurface = (): HTMLElement => {
	const surface = document.createElement("div");
	Object.assign(surface.style, {
		width: `${BUBBLE_SIZE}px`,
		height: `${BUBBLE_SIZE}px`,
		flexShrink: "0",
		borderRadius: "50%",
		background: "#ffffff",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		transition: "width 150ms ease, height 150ms ease",
		pointerEvents: "none"
	} satisfies Partial<CSSStyleDeclaration>);
	surface.appendChild(createPlusIcon());
	return surface;
};

export const createBubbleElement = (): HTMLElement => {
	const el = document.createElement("div");
	Object.assign(el.style, {
		position: "fixed",
		left: "50%",
		top: "50%",
		transform: "translate(-50%, -50%)",
		width: `${BUBBLE_SIZE}px`,
		height: `${BUBBLE_SIZE}px`,
		zIndex: "2147483647",
		cursor: "pointer",
		touchAction: "none",
		userSelect: "none",
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	} satisfies Partial<CSSStyleDeclaration>);

	const surface = createSurface();
	el.appendChild(surface);

	const setSurfaceSize = (size: number) => {
		surface.style.width = `${size}px`;
		surface.style.height = `${size}px`;
	};
	el.addEventListener("pointerenter", () => setSurfaceSize(BUBBLE_SIZE + HOVER_GROWTH));
	el.addEventListener("pointerleave", () => setSurfaceSize(BUBBLE_SIZE));

	return el;
};
