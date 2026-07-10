import type { DismissZone, DragTrail, GroupMember } from "../../types/index.js";
/**
 * The chase simulations behind a docked group drag. The leader's center
 * rides the pointer — grabbing the group anywhere reads as holding its
 * topmost bubble — and every other member springs after its neighbor
 * toward the leader, the chained springs making the tail. While the
 * dismiss target holds the group (and through a captured release's
 * exit) everyone converges on the target instead.
 */
export declare const createDragTrail: (zone: DismissZone, stack: () => GroupMember[]) => DragTrail;
//# sourceMappingURL=trail.d.ts.map