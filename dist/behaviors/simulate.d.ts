/**
 * Drives a per-frame simulation step until it reports settling (returns
 * true). Each frame integrates its real elapsed time in substeps, so
 * low-frame-rate devices run at full speed instead of slow motion;
 * the whole-frame cap keeps a background-tab pause from integrating as
 * one giant leap. Steps receive dt in seconds. Returns a cancel function.
 */
export declare const runSimulation: (step: (dt: number) => boolean) => (() => void);
//# sourceMappingURL=simulate.d.ts.map