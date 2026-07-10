// A non-negative number with optional decimals, suffixed px or %. Mirrors
// the string members of PanelLength so a runtime check accepts exactly what
// the type permits — and no more (no vw/vh: the panel is fixed-positioned,
// so "%" resolves against the scrollbar-free viewport while vh would fold
// the page scrollbar back in; see setAppearance in elements/panel.ts).
const PANEL_LENGTH_STRING = /^\d+(?:\.\d+)?(?:px|%)$/;
/**
 * Runtime guard for a panel dimension: a finite, non-negative number (px),
 * or a `"<n>px"` / `"<n>%"` string. The PanelLength type covers callers
 * who reach the API through TypeScript; this covers values arriving from
 * untyped JavaScript.
 */
export const isPanelLength = (value) => (typeof value === "number" && Number.isFinite(value) && value >= 0) ||
    (typeof value === "string" && PANEL_LENGTH_STRING.test(value));
/**
 * Validates a panel dimension at the API boundary, naming the offending
 * option. A bad value fails loudly at the call instead of silently
 * dropping out of a CSS declaration a paint later. `undefined` passes —
 * every sizing option is optional.
 */
export const assertPanelLength = (value, option) => {
    if (value !== undefined && !isPanelLength(value))
        throw new TypeError(`bubbles: ${option} must be a non-negative number (px) or a "<n>px" / "<n>%" string, received ${JSON.stringify(value)}`);
};
/** Formats a validated panel dimension as a CSS length; a bare number is px. */
export const toCssLength = (value) => typeof value === "number" ? `${value}px` : value;
//# sourceMappingURL=panel-length.js.map