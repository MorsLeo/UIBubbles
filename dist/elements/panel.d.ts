import type { PanelAppearance, PanelController } from "../types/index.js";
/**
 * The expanded content panel. A plain fixed overlay rather than a
 * popover: the top layer would force the panel above the bubbles, and
 * bubbles must always paint on top (a bubble dragged away slides over
 * the fading panel, never behind it) — hence the layered z constants.
 *
 * While visible — fade-out included — the panel follows the group
 * every frame: centered under the flock's centroid, clamped to the
 * screen margins. With no attach point (group emptied) it freezes in
 * place and finishes its fade there. The caret along its top edge aims
 * at this panel's own bubble.
 */
export declare const createPanel: (attachPoint: () => {
    x: number;
    top: number;
    bottom: number;
} | undefined, bubble: HTMLElement, content: HTMLElement, options: {
    id: string;
    label?: string;
    appearance: PanelAppearance;
    onEscape: () => void;
}) => PanelController;
//# sourceMappingURL=panel.d.ts.map