import { setBubbleHover, setBubblePressed } from "../../elements/bubble.js";
/**
 * Group-wide hover/press visuals. Docked, the stack reads as one
 * control: hovering or pressing any member scales every member
 * together. `enabled` gates the wiring so open-row bubbles keep their
 * individual hover states.
 */
export const createGroupFeedback = (members, enabled) => {
    const setHover = (hovered) => {
        for (const m of members)
            setBubbleHover(m.el, hovered);
    };
    const setPressed = (pressed) => {
        for (const m of members)
            setBubblePressed(m.el, pressed);
    };
    const attach = (el) => {
        const whenEnabled = (apply) => () => {
            if (enabled())
                apply();
        };
        const hoverOn = whenEnabled(() => setHover(true));
        const hoverOff = whenEnabled(() => setHover(false));
        const press = whenEnabled(() => setPressed(true));
        const release = whenEnabled(() => setPressed(false));
        el.addEventListener("pointerenter", hoverOn);
        el.addEventListener("pointerleave", hoverOff);
        el.addEventListener("pointerdown", press);
        el.addEventListener("pointerup", release);
        el.addEventListener("pointercancel", release);
    };
    return { setHover, setPressed, attach };
};
//# sourceMappingURL=feedback.js.map