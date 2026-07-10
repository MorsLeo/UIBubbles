import type { BubbleTheme } from "../types/index.js";
export declare const DISMISS_TARGET_SIZE: number;
export interface DismissTargetElement {
    el: HTMLElement;
    setCaptured: (captured: boolean) => void;
    setTheme: (theme: BubbleTheme) => void;
}
export declare const createDismissTargetElement: (theme: BubbleTheme) => DismissTargetElement;
//# sourceMappingURL=dismiss-target.d.ts.map