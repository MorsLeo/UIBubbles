import type { ArrowDirection } from "../types/index.js";
export interface BubbleKeyHandlers {
    /** Enter/Space — activates the bubble exactly like a tap. */
    onActivate(): void;
    /**
     * Arrows — step focus through the open row, or move the docked
     * stack; Ctrl sends a docked stack all the way to the edge.
     */
    onArrow(direction: ArrowDirection, toEnd: boolean): void;
    /** Escape — collapses the open group. */
    onEscape(): void;
    /** Delete/Backspace — dismisses the bubble (row mode). */
    onDelete(): void;
}
/**
 * Routes a bubble's keyboard interactions to the group. preventDefault
 * on handled keys stops Space from scrolling the host page, arrows from
 * panning it, and Backspace from triggering legacy back-navigation.
 */
export declare const makeKeyInteractive: (el: HTMLElement, handlers: BubbleKeyHandlers) => void;
//# sourceMappingURL=keyboard.d.ts.map