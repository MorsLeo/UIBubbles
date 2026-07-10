import type { AxisState } from "../types/index.js";
/**
 * One damped-spring integration step toward `target` over `dt` seconds
 * (semi-implicit Euler — stable at our step sizes and dirt cheap).
 */
export declare const springStep: (state: AxisState, target: number, dt: number) => AxisState;
//# sourceMappingURL=spring.d.ts.map