import { createBubbles } from "$src/index";

const manager = createBubbles();

manager.add({ id: "demo" });

console.log("bubble playground ready", manager);
