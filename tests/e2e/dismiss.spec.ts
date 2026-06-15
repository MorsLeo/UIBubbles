import { expect, test } from "@playwright/test";
import { bubble, dragToDismiss, settled } from "./helpers";

// Drag-to-dismiss — the marquee gesture. Both paths: a docked stack drags as
// a group (dismisses all), an open-row bubble dismisses individually.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

const events = (page: import("@playwright/test").Page) =>
	page.evaluate(() => window.bubbles.events());

test("dragging a docked bubble onto the target dismisses it", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
	});
	await settled(page);

	await dragToDismiss(page, "A");

	// The bubble leaves, and a "user" remove follows the commit-time dismiss.
	await expect(bubble(page, "A")).toHaveCount(0);
	const log = await events(page);
	expect(log).toContainEqual({ event: "dismiss", detail: { id: "a" } });
	expect(log).toContainEqual({ event: "remove", detail: { id: "a", reason: "user" } });

	// dismiss precedes remove.
	const names = log.map((e) => e.event);
	expect(names.indexOf("dismiss")).toBeLessThan(names.indexOf("remove"));

	// Teardown leaves no animation loops running.
	await expect.poll(() => page.evaluate(() => window.bubbles.liveFrames())).toBe(0);
});

test("dragging one open-row bubble dismisses only it", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "B" });
		window.bubbles.activate("b");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	await dragToDismiss(page, "A");

	await expect(bubble(page, "A")).toHaveCount(0);
	await expect(bubble(page, "B")).toBeVisible();

	const log = await events(page);
	expect(log).toContainEqual({ event: "dismiss", detail: { id: "a" } });
	expect(log.filter((e) => e.event === "dismiss")).toHaveLength(1);
});
