import { expect, test } from "@playwright/test";
import { bubble, settled } from "./helpers";

// Proves the harness drives the real library in a real browser: mount,
// a true pointer tap, tap-away, and a clean teardown with no leaked
// animation loops. The broader choreography matrix builds on these.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

test("mounts a bubble and expands it on a real tap", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "chat", label: "Chat", panelText: "Hello from the panel" });
	});

	const chat = bubble(page, "Chat");
	await expect(chat).toBeVisible();
	await settled(page);
	expect(await page.evaluate(() => window.bubbles.state())).toBe("docked");

	// A click is pointerdown+pointerup with no travel — a tap, which expands
	// the docked group and reveals the active panel.
	await chat.click();
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await expect(page.locator('[data-panel-content="chat"]')).toBeVisible();
});

test("right-clicking a bubble does not activate it", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "chat", label: "Chat", panelText: "Hello from the panel" });
	});

	const chat = bubble(page, "Chat");
	await expect(chat).toBeVisible();
	await settled(page);

	await chat.click({ button: "right" });
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("docked");
	await expect(page.locator('[data-panel-content="chat"]')).toBeHidden();
});

test("tap-away collapses, and teardown leaks no animation frames", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "chat", label: "Chat", panelText: "Hi" });
		window.bubbles.activate("chat");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	// A real press on a control outside the flock collapses it.
	await page.locator("#outside").click();
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("docked");

	// Teardown must cancel every running simulation.
	await page.evaluate(() => window.bubbles.destroy());
	await expect.poll(() => page.evaluate(() => window.bubbles.liveFrames())).toBe(0);
});
