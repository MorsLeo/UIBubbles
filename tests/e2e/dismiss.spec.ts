import { expect, test } from "@playwright/test";
import { bubble, dragToDismiss, settled } from "./helpers";

// Fork change (MorsLeo/UIBubbles): user dismissal is removed. The drag that
// used to be the marquee dismiss gesture now just moves the bubbles — a
// release at the old target spot snaps them back to an edge, fires no
// dismiss/remove, and leaves every bubble alive.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

const events = (page: import("@playwright/test").Page) =>
	page.evaluate(() => window.bubbles.events());

test("dragging a docked bubble onto the old target spot does not dismiss it", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
	});
	await settled(page);

	await dragToDismiss(page, "A");
	await settled(page);

	await expect(bubble(page, "A")).toBeVisible();
	const log = await events(page);
	expect(log.filter((e) => e.event === "dismiss" || e.event === "remove")).toEqual([]);

	// No dismissal leaves no animation loops running either.
	await expect.poll(() => page.evaluate(() => window.bubbles.liveFrames())).toBe(0);
});

test("dragging one open-row bubble onto the old target spot keeps the row intact", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "B" });
		window.bubbles.activate("b");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	await dragToDismiss(page, "A");
	await settled(page);

	await expect(bubble(page, "A")).toBeVisible();
	await expect(bubble(page, "B")).toBeVisible();
	const log = await events(page);
	expect(log.filter((e) => e.event === "dismiss")).toEqual([]);
});
