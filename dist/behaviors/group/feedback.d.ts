import type { GroupFeedback, GroupMember } from "../../types/index.js";
/**
 * Group-wide hover/press visuals. Docked, the stack reads as one
 * control: hovering or pressing any member scales every member
 * together. `enabled` gates the wiring so open-row bubbles keep their
 * individual hover states.
 */
export declare const createGroupFeedback: (members: GroupMember[], enabled: () => boolean) => GroupFeedback;
//# sourceMappingURL=feedback.d.ts.map