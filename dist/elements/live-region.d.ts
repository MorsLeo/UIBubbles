/** A polite ARIA live region for status announcements. */
export interface LiveRegion {
    /** Speaks a message to assistive tech politely — never interrupting. */
    announce(message: string): void;
    destroy(): void;
}
/**
 * Two polite regions, announced into alternately. Re-setting a node to the
 * same text it already holds is dropped by some screen reader/browser combos
 * (two unlabelled adds both say "Bubble added"), so each message lands in a
 * freshly-cleared region — an unambiguous change even when it repeats. Exactly
 * one node holds text at a time, so the pair's combined text is always just the
 * latest message. Created lazily, kept until destroy() so a message fired as
 * the overlay tears down (the last bubble leaving) still has somewhere to read.
 */
export declare const createLiveRegion: () => LiveRegion;
//# sourceMappingURL=live-region.d.ts.map