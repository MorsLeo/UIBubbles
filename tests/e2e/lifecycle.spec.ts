import { expect, test } from "@playwright/test";
import { bubble, focusedLabel, settled } from "./helpers";

// The open/close lifecycle: entering and docking, expanding into the row,
// switching panels, collapsing, and programmatic activate().

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

const state = (page: import("@playwright/test").Page) =>
	page.evaluate(() => window.bubbles.state());
const active = (page: import("@playwright/test").Page) =>
	page.evaluate(() => window.bubbles.active());

test("the first bubble flies in and docks against the edge", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A" });
	});

	const a = bubble(page, "A");
	await expect(a).toBeVisible();
	await settled(page);

	// Default side is "right": it rests in the right half, near the edge.
	const box = await a.boundingBox();
	const vp = page.viewportSize();
	expect(box && vp).toBeTruthy();
	expect(box!.x).toBeGreaterThan(vp!.width / 2);
	expect(box!.x + box!.width).toBeGreaterThan(vp!.width - 24);
});

test("tap expands the stack and shows the panel; tapping the active bubble collapses", async ({
	page
}) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
	});
	await settled(page);

	await bubble(page, "A").click();
	await expect.poll(() => state(page)).toBe("open");
	await expect(page.locator('[data-panel-content="a"]')).toBeVisible();

	await bubble(page, "A").click();
	await expect.poll(() => state(page)).toBe("docked");
});

test("tapping another bubble switches the active panel", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "Panel B" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => active(page)).toBe("a");
	await expect(page.locator('[data-panel-content="a"]')).toBeVisible();

	await bubble(page, "B").click();
	await expect.poll(() => active(page)).toBe("b");
	await expect(page.locator('[data-panel-content="b"]')).toBeVisible();
});

test("Escape collapses the group and returns focus to the stack", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => state(page)).toBe("open");
	await settled(page);

	await page.keyboard.press("Escape");
	await expect.poll(() => state(page)).toBe("docked");
	expect(await focusedLabel(page)).toBe("A");
});

test("activate() expands a docked group onto the chosen bubble", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "B" });
	});
	await settled(page);
	expect(await state(page)).toBe("docked");

	await page.evaluate(() => window.bubbles.activate("a"));
	await expect.poll(() => state(page)).toBe("open");
	await expect.poll(() => active(page)).toBe("a");
	await expect(page.locator('[data-panel-content="a"]')).toBeVisible();
});

test("with reduced motion, expand and tap-away still reach their end states", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	// The library reads the preference live per animation, so confirm it took
	// — otherwise this would pass without exercising the reduced-motion paths.
	expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
		true
	);

	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => state(page)).toBe("open");
	await expect(page.locator('[data-panel-content="a"]')).toBeVisible();

	await page.locator("#outside").click();
	await expect.poll(() => state(page)).toBe("docked");
});
