/**
 * Preset color schemes, named for the host page they suit. Exported so
 * consumers can read a preset's tokens when building overrides.
 */
export const bubbleThemes = {
    dark: {
        bubbleSurface: "#ffffff",
        bubbleIcon: "#000000",
        bubbleShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        focusRing: "#ffffff",
        panelSurface: "#1c1c1e",
        panelText: "#ffffff",
        panelShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
        dismissSurface: "rgba(255, 255, 255, 0.18)",
        dismissBorder: "rgba(255, 255, 255, 0.35)",
        dismissIcon: "#ffffff"
    },
    light: {
        bubbleSurface: "#1c1c1e",
        bubbleIcon: "#ffffff",
        bubbleShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
        focusRing: "#1c1c1e",
        panelSurface: "#ffffff",
        panelText: "#1c1c1e",
        panelShadow: "0 12px 32px rgba(0, 0, 0, 0.18)",
        dismissSurface: "rgba(0, 0, 0, 0.08)",
        dismissBorder: "rgba(0, 0, 0, 0.25)",
        dismissIcon: "#1c1c1e"
    }
};
/** A preset with per-token overrides folded in. */
export const resolveTheme = (name, overrides) => ({ ...bubbleThemes[name], ...overrides });
/** The preset matching the browser's color-scheme preference right now. */
export const systemThemeName = () => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
//# sourceMappingURL=theme.js.map