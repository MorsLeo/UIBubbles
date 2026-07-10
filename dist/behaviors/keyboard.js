/**
 * Routes a bubble's keyboard interactions to the group. preventDefault
 * on handled keys stops Space from scrolling the host page, arrows from
 * panning it, and Backspace from triggering legacy back-navigation.
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
            case "Delete":
            case "Backspace":
                handlers.onDelete();
                break;
            default:
                return;
        }
        event.preventDefault();
    });
};
//# sourceMappingURL=keyboard.js.map