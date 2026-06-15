import { type Page, expect, test } from "@playwright/test";
import { bubble } from "./helpers";

// Touch + small-viewport coverage on real mobile devices (Pixel 7 /
// iPhone 14): the tap-driven main flows, exercising the coarse-pointer
// tap path and the viewport-scaled layout. Drag gestures need a CDP touch
// helper and are intentionally out of scope here.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

const state = (page: Page) => page.evaluate(() => window.bubbles.state());
const active = (page: Page) => page.evaluate(() => window.bubbles.active());

test("tap expands the stack and shows the panel", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
	});

	await bubble(page, "A").tap();
	await expect.poll(() => state(page)).toBe("open");
	await expect(page.locator('[data-panel-content="a"]')).toBeVisible();
});

test("tapping another bubble switches the active panel", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "Panel B" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => active(page)).toBe("a");

	await bubble(page, "B").tap();
	await expect.poll(() => active(page)).toBe("b");
	await expect(page.locator('[data-panel-content="b"]')).toBeVisible();
});

test("tapping outside collapses the open group", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		// No panel, so there's clear empty space below the row to tap.
		window.bubbles.add({ id: "a", label: "A" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => state(page)).toBe("open");

	const vp = page.viewportSize()!;
	await page.touchscreen.tap(vp.width / 2, vp.height - 80);
	await expect.poll(() => state(page)).toBe("docked");
});
