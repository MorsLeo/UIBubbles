import type { DragTrail, GroupMember } from "../../types/index.js";
/**
 * The chase simulations behind a docked group drag. The leader's center
 * rides the pointer — grabbing the group anywhere reads as holding its
 * topmost bubble — and every other member springs after its neighbor
 * toward the leader, the chained springs making the tail.
 */
export declare const createDragTrail: (stack: () => GroupMember[]) => DragTrail;
//# sourceMappingURL=trail.d.ts.map