/**
 * Usable viewport for layout math. window.innerWidth/innerHeight include
 * any page scrollbars, but fixed-position elements live in the viewport
 * that excludes them — innerWidth math butts right-docked elements
 * against a vertical scrollbar. documentElement.clientWidth/clientHeight
 * measure the scrollbar-free area.
 */
export const viewportWidth = (): number => document.documentElement.clientWidth;

export const viewportHeight = (): number => document.documentElement.clientHeight;
