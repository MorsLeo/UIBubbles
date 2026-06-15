import { Z_BUBBLE_TOP } from "$src/constants";
import type { BubbleTheme } from "$src/types";

export const BUBBLE_SIZE = 56;

/** Pixels added to the visual diameter on hover (~1.07x). */
const HOVER_GROWTH = 4;

/** Pixels removed from the visual diameter while pressed (~0.93x). */
const ACTIVE_SHRINK = 4;

/**
 * Ring marking the focused bubble. It sits on the surface and the circle
 * shrinks to make room, so circle + gap + ring never exceed the bubble's
 * normal footprint.
 */
const OUTLINE_WIDTH = 3;

/** Gap between the surface edge and the focus ring. */
const OUTLINE_GAP = 3;

/** Extra diameter the ring needs — what the focused circle gives up. */
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
	{ setHovered(hovered: boolean): void; setPressed(pressed: boolean): void }
>();

export const setBubbleHover = (el: HTMLElement, hovered: boolean): void => {
	visualControls.get(el)?.setHovered(hovered);
};

export const setBubblePressed = (el: HTMLElement, pressed: boolean): void => {
	visualControls.get(el)?.setPressed(pressed);
};

/** Per-element repaint hooks, so configure() can retheme live bubbles. */
const themeControls = new WeakMap<HTMLElement, (theme: BubbleTheme) => void>();

export const setBubbleTheme = (el: HTMLElement, theme: BubbleTheme): void => {
	themeControls.get(el)?.(theme);
};

// Lucide "ellipsis", inlined because the library builds with plain tsc — a
// Vite-style ?raw svg import would ship an unresolvable specifier in dist.
const createDefaultIcon = (stroke: string): SVGSVGElement => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 24 24");
	svg.setAttribute("width", "24");
	svg.setAttribute("height", "24");
	svg.setAttribute("fill", "none");
	svg.setAttribute("stroke", stroke);
	svg.setAttribute("stroke-width", "2");
	svg.setAttribute("stroke-linecap", "round");
	svg.setAttribute("stroke-linejoin", "round");
	svg.innerHTML =
		'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>';
	return svg;
};

/**
 * The visible circle. Lives inside the positioned element so hover growth
 * is a real size change (always crisp) instead of a transform scale, which
 * blurs the rasterized layer. Shows the consumer's icon, or the default
 * ellipsis glyph when none is given.
 */
const createSurface = (theme: BubbleTheme, icon: Element): HTMLElement => {
	const surface = document.createElement("div");
	Object.assign(surface.style, {
		width: `${SURFACE_SIZE}px`,
		height: `${SURFACE_SIZE}px`,
		flexShrink: "0",
		borderRadius: "50%",
		background: theme.bubbleSurface,
		boxShadow: theme.bubbleShadow,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		scale: `${BUBBLE_SIZE / SURFACE_SIZE}`,
		outline: `${OUTLINE_WIDTH}px solid transparent`,
		outlineOffset: `${OUTLINE_GAP}px`,
		transition: "scale 150ms ease, outline-color 150ms ease",
		pointerEvents: "none"
	} satisfies Partial<CSSStyleDeclaration>);
	surface.appendChild(icon);

	// The bubble names itself via aria-label; its visual innards (icon,
	// ring, consumer markup) would only add noise to the tree.
	surface.setAttribute("aria-hidden", "true");
	return surface;
};

export const createBubbleElement = (
	initialTheme: BubbleTheme,
	icon?: HTMLElement,
	label?: string
): HTMLElement => {
	let theme = initialTheme;
	const el = document.createElement("div");

	// The surface draws its own focus ring, so the native one stays off.
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
		justifyContent: "center",
		outline: "none"
	} satisfies Partial<CSSStyleDeclaration>);

	el.setAttribute("role", "button");
	el.tabIndex = 0;
	el.setAttribute("aria-label", label ?? "Bubble");

	// The fallback glyph is the library's to retheme; a consumer icon isn't.
	const fallbackIcon = icon ? undefined : createDefaultIcon(theme.bubbleIcon);
	const surface = createSurface(theme, icon ?? fallbackIcon!);
	el.appendChild(surface);

	let hovered = false;
	let pressed = false;
	let focused = false;
	const syncSurfaceScale = () => {
		const visualSize = pressed
			? BUBBLE_SIZE - ACTIVE_SHRINK
			: hovered
				? BUBBLE_SIZE + HOVER_GROWTH
				: BUBBLE_SIZE;

		// The focus ring fits inside the normal footprint: the surface
		// shrinks so circle + gap + ring together span visualSize.
		const span = focused ? SURFACE_SIZE + OUTLINE_SPAN : SURFACE_SIZE;
		surface.style.scale = `${visualSize / span}`;
	};

	const syncFocusRing = (next: boolean) => {
		focused = next;
		surface.style.outlineColor = next ? theme.focusRing : "transparent";
		syncSurfaceScale();
	};

	// The ring marks the focused bubble, whatever moved focus there — mouse,
	// keyboard, or a programmatic activate(). The focused bubble is the live
	// target (arrow keys step between bubbles, Escape collapses from it), so
	// a plain :focus, not :focus-visible: if it can be driven, it's marked.
	el.addEventListener("focus", () => syncFocusRing(true));
	el.addEventListener("blur", () => syncFocusRing(false));

	visualControls.set(el, {
		setHovered: (next) => {
			hovered = next;
			syncSurfaceScale();
		},
		setPressed: (next) => {
			pressed = next;
			syncSurfaceScale();
		}
	});

	themeControls.set(el, (next) => {
		theme = next;
		surface.style.background = theme.bubbleSurface;
		surface.style.boxShadow = theme.bubbleShadow;
		fallbackIcon?.setAttribute("stroke", theme.bubbleIcon);
		if (focused) surface.style.outlineColor = theme.focusRing;
	});

	el.addEventListener("pointerenter", () => setBubbleHover(el, true));
	el.addEventListener("pointerleave", () => setBubbleHover(el, false));
	el.addEventListener("pointerdown", () => setBubblePressed(el, true));
	el.addEventListener("pointerup", () => setBubblePressed(el, false));
	el.addEventListener("pointercancel", () => setBubblePressed(el, false));

	return el;
};
