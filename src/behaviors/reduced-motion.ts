/**
 * Live read of the user's reduced-motion preference, checked as each
 * motion starts — an OS-level toggle applies from the next interaction
 * without any listener bookkeeping.
 */
export const prefersReducedMotion = (): boolean =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;
