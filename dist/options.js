import { MAX_BUBBLES } from "./constants.js";
import { assertPanelLength } from "./panel-length.js";
import { RESTITUTION } from "./physics/config.js";
/** Expanded panel width (px) when the consumer doesn't choose one. */
export const DEFAULT_PANEL_WIDTH = 480;
/** Applies every default; the theme stays a choice, resolved at paint time. */
export const resolveOptions = (options = {}) => {
    assertPanelLength(options.panelWidth, "panelWidth");
    assertPanelLength(options.panelMaxHeight, "panelMaxHeight");
    return {
        theme: options.theme ?? "auto",
        colors: options.colors,
        side: options.side ?? "right",
        vertical: Math.min(Math.max(options.vertical ?? 0.5, 0), 1),
        panelWidth: options.panelWidth ?? DEFAULT_PANEL_WIDTH,
        panelMaxHeight: options.panelMaxHeight,
        maxBubbles: Math.max(1, options.maxBubbles ?? MAX_BUBBLES),
        ricochet: Math.min(Math.max(options.ricochet ?? RESTITUTION, 0), 1),
        initialState: options.initialState ?? "docked"
    };
};
// An absent overrides object and an empty one paint identically.
const sameColors = (a = {}, b = {}) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys)
        if (a[key] !== b[key])
            return false;
    return true;
};
/**
 * True when two resolved configurations paint and behave identically, so
 * configure() can skip the repaint. Props-driven consumers (framework
 * wrappers) call configure() on every render; this makes the unchanged
 * call free.
 */
export const sameOptions = (a, b) => a.theme === b.theme &&
    a.side === b.side &&
    a.vertical === b.vertical &&
    a.panelWidth === b.panelWidth &&
    a.panelMaxHeight === b.panelMaxHeight &&
    a.maxBubbles === b.maxBubbles &&
    a.ricochet === b.ricochet &&
    a.initialState === b.initialState &&
    sameColors(a.colors, b.colors);
//# sourceMappingURL=options.js.map