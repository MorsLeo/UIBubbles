/**
 * Routes a bubble's keyboard interactions to the group. preventDefault
 * on handled keys stops Space from scrolling the host page and arrows
 * from panning it.
 */
export const makeKeyInteractive = (el, handlers) => {
    el.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "Enter":
            case " ":
                handlers.onActivate();
                break;
            case "ArrowLeft":
                handlers.onArrow("left", event.ctrlKey);
                break;
            case "ArrowRight":
                handlers.onArrow("right", event.ctrlKey);
                break;
            case "ArrowUp":
                handlers.onArrow("up", event.ctrlKey);
                break;
            case "ArrowDown":
                handlers.onArrow("down", event.ctrlKey);
                break;
            case "Escape":
                handlers.onEscape();
                break;
            default:
                return;
        }
        event.preventDefault();
    });
};
//# sourceMappingURL=keyboard.js.map