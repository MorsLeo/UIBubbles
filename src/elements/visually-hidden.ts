/**
 * Inline style that clips an element out of view while leaving it in the
 * accessibility tree — for the live region and the aria-owns group owner,
 * which must be reachable by assistive tech but never seen.
 */
export const visuallyHidden = {
	position: "absolute",
	width: "1px",
	height: "1px",
	margin: "-1px",
	padding: "0",
	overflow: "hidden",
	clip: "rect(0 0 0 0)",
	clipPath: "inset(50%)",
	whiteSpace: "nowrap",
	border: "0"
} satisfies Partial<CSSStyleDeclaration>;
