import { Z_BUBBLE_TOP } from "$src/constants";

export const BUBBLE_SIZE = 56;

/** Pixels added to the visual diameter on hover (~1.07x). */
const HOVER_GROWTH = 4;

/** Pixels removed from the visual diameter while pressed (~0.93x). */
const ACTIVE_SHRINK = 4;

/** Ring marking the active bubble while the row is open. It sits on the
 * surface and the active circle shrinks to make room, so circle + gap +
 * ring never exceed the bubble's normal footprint. */
const OUTLINE_WIDTH = 3;

/** Gap between the surface edge and the active ring. */
const OUTLINE_GAP = 3;

/** Extra diameter the ring needs — what the active circle gives up. */
const OUTLINE_SPAN = 2 * (OUTLINE_GAP + OUTLINE_WIDTH);

/**
 * The surface is rendered at hover size and scaled DOWN for the rest
 * and pressed states, so the raster is never stretched past its native
 * resolution — that's what keeps the icon crisp at every state.
 */
const SURFACE_SIZE = BUBBLE_SIZE + HOVER_GROWTH;

/** Per-element visual state setters, so the group can scale members together. */
const visualControls = new WeakMap<
	HTMLElement,
	{
		setHovered(hovered: boolean): void;
		setPressed(pressed: boolean): void;
		setActive(active: boolean): void;
	}
>();

export const setBubbleHover = (el: HTMLElement, hovered: boolean): void => {
	visualControls.get(el)?.setHovered(hovered);
};

export const setBubblePressed = (el: HTMLElement, pressed: boolean): void => {
	visualControls.get(el)?.setPressed(pressed);
};

export const setBubbleActive = (el: HTMLElement, active: boolean): void => {
	visualControls.get(el)?.setActive(active);
};

// Lucide "message-square" (playground/icons/chat.svg), inlined because
// the library builds with plain tsc — a Vite-style ?raw svg import
// would ship an unresolvable specifier in dist.
const createChatIcon = (): SVGSVGElement => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("width", "24");
	svg.setAttribute("height", "24");
	svg.setAttribute("fill", "none");
	svg.setAttribute("stroke", "#000000");
	svg.setAttribute("stroke-width", "2");
	svg.setAttribute("stroke-linecap", "round");
	svg.setAttribute("stroke-linejoin", "round");
	svg.innerHTML =
		'<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />';
	return svg;
};

/**
 * The visible circle. Lives inside the positioned element so hover growth
 * is a real size change (always crisp) instead of a transform scale, which
 * blurs the rasterized layer. Shows the consumer's icon, or the default
 * chat glyph when none is given.
 */
const createSurface = (icon?: HTMLElement): HTMLElement => {
	const surface = document.createElement("div");
	Object.assign(surface.style, {
		width: `${SURFACE_SIZE}px`,
		height: `${SURFACE_SIZE}px`,
		flexShrink: "0",
		borderRadius: "50%",
		background: "#ffffff",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		scale: `${BUBBLE_SIZE / SURFACE_SIZE}`,
		outline: `${OUTLINE_WIDTH}px solid transparent`,
		outlineOffset: `${OUTLINE_GAP}px`,
		transition: "scale 150ms ease, outline-color 150ms ease",
		pointerEvents: "none"
	} satisfies Partial<CSSStyleDeclaration>);
	surface.appendChild(icon ?? createChatIcon());
	return surface;
};

export const createBubbleElement = (icon?: HTMLElement): HTMLElement => {
	const el = document.createElement("div");
	Object.assign(el.style, {
		position: "fixed",
		width: `${BUBBLE_SIZE}px`,
		height: `${BUBBLE_SIZE}px`,
		zIndex: `${Z_BUBBLE_TOP}`,
		cursor: "pointer",
		touchAction: "none",
		userSelect: "none",
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	} satisfies Partial<CSSStyleDeclaration>);

	const surface = createSurface(icon);
	el.appendChild(surface);

	let hovered = false;
	let pressed = false;
	let active = false;
	const syncSurfaceScale = () => {
		const visualSize = pressed
			? BUBBLE_SIZE - ACTIVE_SHRINK
			: hovered
				? BUBBLE_SIZE + HOVER_GROWTH
				: BUBBLE_SIZE;

		// The active ring fits inside the normal footprint: the surface
		// shrinks so circle + gap + ring together span visualSize.
		const span = active ? SURFACE_SIZE + OUTLINE_SPAN : SURFACE_SIZE;
		surface.style.scale = `${visualSize / span}`;
	};

	visualControls.set(el, {
		setHovered: (next) => {
			hovered = next;
			syncSurfaceScale();
		},
		setPressed: (next) => {
			pressed = next;
			syncSurfaceScale();
		},
		setActive: (next) => {
			active = next;
			surface.style.outlineColor = next ? "#ffffff" : "transparent";
			syncSurfaceScale();
		}
	});

	el.addEventListener("pointerenter", () => setBubbleHover(el, true));
	el.addEventListener("pointerleave", () => setBubbleHover(el, false));
	el.addEventListener("pointerdown", () => setBubblePressed(el, true));
	el.addEventListener("pointerup", () => setBubblePressed(el, false));
	el.addEventListener("pointercancel", () => setBubblePressed(el, false));

	return el;
};
